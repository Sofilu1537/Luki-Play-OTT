import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { HlsValidatorService } from './hls-validator.service.js';

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
 *   healthStatus        — 'HEALTHY' | 'DEGRADED' | 'OFFLINE'
 *   lastHealthCheckAt   — timestamp of last attempt
 *   uptimePercent       — rolling moving average (0–100)
 *
 * Health mapping:
 *   VALID      → HEALTHY   (reachable + valid M3U8 + active segments)
 *   NO_SIGNAL  → DEGRADED  (reachable + valid M3U8, but no segments yet)
 *   INVALID    → OFFLINE   (unreachable or not a valid HLS response)
 */
@Injectable()
export class ChannelHealthService {
  private readonly logger = new Logger(ChannelHealthService.name);

  /** Number of samples used for the rolling uptime average */
  private static readonly ROLLING_SAMPLES = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hlsValidator: HlsValidatorService,
  ) {}

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
    const result = await this.hlsValidator.validate(streamUrl, { probeSegment: false });

    // Map HLS validation result to DB health status
    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
    let uptimeSample: number;

    switch (result.status) {
      case 'VALID':
        healthStatus  = 'HEALTHY';
        uptimeSample  = 100;
        break;
      case 'NO_SIGNAL':
        // Reachable and a valid playlist, but no segments — stream is degraded
        healthStatus  = 'DEGRADED';
        uptimeSample  = 0;
        break;
      default:
        healthStatus  = 'OFFLINE';
        uptimeSample  = 0;
        break;
    }

    const newUptime = this.rollingAverage(currentUptime, uptimeSample);

    await this.prisma.channel.update({
      where: { id },
      data: {
        healthStatus,
        lastHealthCheckAt: new Date(),
        uptimePercent:     newUptime,
      },
    });
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
