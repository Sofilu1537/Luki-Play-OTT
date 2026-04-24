import { Injectable, Logger } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HlsStatus = 'VALID' | 'NO_SIGNAL' | 'INVALID';

export interface HlsValidationResult {
  status: HlsStatus;
  isReachable: boolean;
  hasPlaylist: boolean;
  hasSegments: boolean;
  segmentProbe?: SegmentProbeResult;
  error?: string;
}

export interface SegmentProbeResult {
  /** The resolved segment URL that was probed */
  url: string;
  /** Whether the segment responded with a success status */
  reachable: boolean;
}

export interface HlsValidatorOptions {
  /** Request timeout in milliseconds (default: 8 000) */
  timeoutMs?: number;
  /** Number of fetch attempts before giving up (default: 2) */
  retries?: number;
  /** Whether to probe the first .ts segment (default: true) */
  probeSegment?: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS: Required<HlsValidatorOptions> = {
  timeoutMs: 8_000,
  retries: 2,
  probeSegment: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when the string looks like a proper URL. */
function isValidUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resolves a potentially-relative segment path against the playlist's base URL.
 * e.g. base = "https://cdn.example.com/live/index.m3u8"
 *      segment = "seg_001.ts"  →  "https://cdn.example.com/live/seg_001.ts"
 */
function resolveSegmentUrl(playlistUrl: string, segmentPath: string): string {
  if (/^https?:\/\//i.test(segmentPath)) return segmentPath;

  const base = new URL(playlistUrl);

  if (segmentPath.startsWith('/')) {
    // Absolute path on the same origin
    return `${base.protocol}//${base.host}${segmentPath}`;
  }

  // Relative — replace the last path component
  const dir = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
  return `${base.protocol}//${base.host}${dir}${segmentPath}`;
}

/**
 * Extracts the first `.ts` or `EXTINF`-prefixed segment URI from an M3U8 body.
 * Returns null when no segment lines are found.
 */
function extractFirstSegment(m3u8Body: string): string | null {
  const lines = m3u8Body.split('\n').map((l) => l.trim());
  let takeNext = false;

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      takeNext = true;
      continue;
    }
    if (takeNext && line.length > 0 && !line.startsWith('#')) {
      return line;
    }
    // Also accept bare .ts lines even without a preceding EXTINF
    if (!line.startsWith('#') && line.endsWith('.ts') && line.length > 0) {
      return line;
    }
  }

  return null;
}

/** Returns true when the playlist body contains active segment indicators. */
function playlistHasSegments(body: string): boolean {
  return /\.ts(\?[^\s]*)?(\s|$)/m.test(body) || /#EXTINF:/m.test(body);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class HlsValidatorService {
  private readonly logger = new Logger(HlsValidatorService.name);

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Validates a single HLS stream URL.
   *
   * @param streamUrl  The `.m3u8` URL to validate.
   * @param options    Optional timeout / retry / segment-probe settings.
   */
  async validate(
    streamUrl: string,
    options?: HlsValidatorOptions,
  ): Promise<HlsValidationResult> {
    const opts: Required<HlsValidatorOptions> = { ...DEFAULTS, ...options };

    // 1. Structural URL check
    if (!isValidUrl(streamUrl)) {
      return {
        status: 'INVALID',
        isReachable: false,
        hasPlaylist: false,
        hasSegments: false,
        error: 'Malformed URL — must start with http:// or https://',
      };
    }

    // 2. Fetch the playlist
    let body: string;
    try {
      body = await this.fetchWithRetry(streamUrl, opts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[HLS] Unreachable: ${streamUrl} — ${msg}`);
      return {
        status: 'INVALID',
        isReachable: false,
        hasPlaylist: false,
        hasSegments: false,
        error: msg,
      };
    }

    // 3. Confirm it is an HLS playlist
    if (!body.trimStart().startsWith('#EXTM3U')) {
      return {
        status: 'INVALID',
        isReachable: true,
        hasPlaylist: false,
        hasSegments: false,
        error: 'Response body is not a valid HLS playlist (missing #EXTM3U)',
      };
    }

    // 4. Detect active segments
    const hasSegments = playlistHasSegments(body);

    if (!hasSegments) {
      return {
        status: 'NO_SIGNAL',
        isReachable: true,
        hasPlaylist: true,
        hasSegments: false,
        error: 'Playlist contains no .ts segments or EXTINF entries',
      };
    }

    // 5. Optional: probe the first segment
    let segmentProbe: SegmentProbeResult | undefined;
    if (opts.probeSegment) {
      segmentProbe = await this.probeFirstSegment(streamUrl, body, opts);
    }

    return {
      status: 'VALID',
      isReachable: true,
      hasPlaylist: true,
      hasSegments: true,
      segmentProbe,
    };
  }

  /**
   * Validates multiple stream URLs concurrently.
   * Returns a map of URL → result for easy lookup.
   */
  async validateMany(
    urls: string[],
    options?: HlsValidatorOptions,
  ): Promise<Map<string, HlsValidationResult>> {
    const entries = await Promise.allSettled(
      urls.map(async (url) => {
        const result = await this.validate(url, options);
        return [url, result] as const;
      }),
    );

    const map = new Map<string, HlsValidationResult>();
    for (const entry of entries) {
      if (entry.status === 'fulfilled') {
        const [url, result] = entry.value;
        map.set(url, result);
      }
    }
    return map;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Performs a GET request with an AbortController timeout.
   * Retries up to `opts.retries` times on network/timeout failures.
   */
  private async fetchWithRetry(
    url: string,
    opts: Required<HlsValidatorOptions>,
  ): Promise<string> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= opts.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.apple.mpegurl, application/x-mpegurl, */*',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        return await res.text();
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (lastError.name === 'AbortError') {
          lastError = new Error(`Request timed out after ${opts.timeoutMs} ms`);
        }

        if (attempt < opts.retries) {
          this.logger.debug(
            `[HLS] Attempt ${attempt}/${opts.retries} failed for ${url}: ${lastError.message}`,
          );
        }
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError;
  }

  /** Extracts, resolves, and probes the first .ts segment in the playlist. */
  private async probeFirstSegment(
    playlistUrl: string,
    body: string,
    opts: Required<HlsValidatorOptions>,
  ): Promise<SegmentProbeResult> {
    const rawSegment = extractFirstSegment(body);

    if (!rawSegment) {
      return { url: '', reachable: false };
    }

    const resolvedUrl = resolveSegmentUrl(playlistUrl, rawSegment);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const res = await fetch(resolvedUrl, {
        method: 'HEAD',
        signal: controller.signal,
        // Some CDNs reject HEAD for .ts files; accept partial content too
        headers: { Range: 'bytes=0-0' },
      });

      return {
        url: resolvedUrl,
        reachable: res.ok || res.status === 206,
      };
    } catch {
      return { url: resolvedUrl, reachable: false };
    } finally {
      clearTimeout(timer);
    }
  }
}
