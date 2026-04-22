import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * ChannelHealthService
 *
 * Runs a health check every 2 minutes against every channel with status ACTIVE.
 * For each channel it attempts a HEAD request (with fallback to GET) against
 * the primary streamUrl.  On success it marks the channel HEALTHY; on failure
 * it marks it OFFLINE.  The uptimePercent is updated as a rolling 100-sample
 * moving average so the value decays naturally over time.
 *
 * Fields written:
 *   healthStatus        — 'HEALTHY' | 'OFFLINE'
 *   lastHealthCheckAt   — timestamp of last attempt
 *   uptimePercent       — rolling moving average (0–100)
 */
@Injectable()
export class ChannelHealthService {
  private readonly logger = new Logger(ChannelHealthService.name);

  /** Number of samples used for the rolling uptime average */
  private static readonly ROLLING_SAMPLES = 100;

  /** HTTP request timeout in milliseconds */
  private static readonly TIMEOUT_MS = 6_000;

  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Cron — every 2 minutes
  // -------------------------------------------------------------------------

  @Cron('*/2 * * * *')
  async runHealthChecks(): Promise<void> {
    const channels = await this.prisma.channel.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, streamUrl: true, uptimePercent: true },
    });

    if (channels.length === 0) return;

    this.logger.log(`Health-checking ${channels.length} active channel(s)…`);

    const results = await Promise.allSettled(
      channels.map((ch) => this.checkOne(ch.id, ch.streamUrl, ch.uptimePercent)),
    );

    const ok  = results.filter((r) => r.status === 'fulfilled').length;
    const err = results.filter((r) => r.status === 'rejected').length;
    this.logger.log(`Health check complete — ${ok} ok, ${err} errors`);
  }

  // -------------------------------------------------------------------------
  // Per-channel check
  // -------------------------------------------------------------------------

  private async checkOne(
    id: string,
    streamUrl: string,
    currentUptime: number,
  ): Promise<void> {
    const isUp = await this.probeUrl(streamUrl);
    const newUptime = this.rollingAverage(currentUptime, isUp ? 100 : 0);

    await this.prisma.channel.update({
      where: { id },
      data: {
        healthStatus:       isUp ? 'HEALTHY' : 'OFFLINE',
        lastHealthCheckAt:  new Date(),
        uptimePercent:      newUptime,
      },
    });
  }

  // -------------------------------------------------------------------------
  // HTTP probe
  // -------------------------------------------------------------------------

  private async probeUrl(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      ChannelHealthService.TIMEOUT_MS,
    );

    try {
      // Try HEAD first (cheap); fall back to GET range request for strict HLS
      const res = await fetch(url, {
        method:  'HEAD',
        signal:  controller.signal,
        headers: { 'Range': 'bytes=0-0' },
      });

      // 2xx or 206 Partial Content = stream is reachable
      return res.ok || res.status === 206;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  // -------------------------------------------------------------------------
  // Rolling average helper
  // -------------------------------------------------------------------------

  private rollingAverage(current: number, sample: number): number {
    const n = ChannelHealthService.ROLLING_SAMPLES;
    const next = ((current * (n - 1)) + sample) / n;
    return Math.round(next * 100) / 100; // 2 decimal places
  }
}
