import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StreamSessionService {
  private readonly STALE_MS = 90_000;

  constructor(private readonly prisma: PrismaService) {}

  async startStream(
    customerId: string,
    contractId: string | undefined,
    deviceId: string,
    channelId: string,
  ): Promise<string> {
    const staleThreshold = new Date(Date.now() - this.STALE_MS);

    await this.prisma.activeStream.deleteMany({
      where: { customerId, lastHeartbeat: { lt: staleThreshold } },
    });

    const { max, policy } = await this.resolveLimit(customerId, contractId);

    const current = await this.prisma.activeStream.findMany({
      where: { customerId },
      orderBy: { startedAt: 'asc' },
    });

    if (current.length >= max) {
      if (policy === 'REPLACE_OLDEST') {
        await this.prisma.activeStream.delete({ where: { id: current[0]!.id } });
      } else {
        throw new HttpException(
          'Límite de streams simultáneos alcanzado en tu plan.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const stream = await this.prisma.activeStream.create({
      data: { customerId, contractId: contractId ?? null, deviceId, channelId },
    });

    return stream.id;
  }

  async heartbeat(streamId: string, customerId: string): Promise<void> {
    await this.prisma.activeStream.updateMany({
      where: { id: streamId, customerId },
      data: { lastHeartbeat: new Date() },
    });
  }

  async stopStream(streamId: string, customerId: string): Promise<void> {
    await this.prisma.activeStream.deleteMany({
      where: { id: streamId, customerId },
    });
  }

  private async resolveLimit(
    customerId: string,
    contractId: string | undefined,
  ): Promise<{ max: number; policy: string }> {
    if (contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        select: { maxConcurrentStreams: true, sessionLimitPolicy: true },
      });
      if (contract) {
        return {
          max: contract.maxConcurrentStreams,
          policy: contract.sessionLimitPolicy,
        };
      }
    }

    const sub = await this.prisma.subscription.findFirst({
      where: { customerId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { planSnapshot: true },
    });

    if (sub?.planSnapshot) {
      const snap = sub.planSnapshot as Record<string, unknown>;
      const snapMax = typeof snap['maxConcurrentStreams'] === 'number' ? snap['maxConcurrentStreams'] : null;
      const snapPolicy = typeof snap['sessionLimitPolicy'] === 'string' ? snap['sessionLimitPolicy'] : null;
      if (snapMax !== null) {
        return { max: snapMax, policy: snapPolicy ?? 'BLOCK_NEW' };
      }
    }

    const plan = await this.prisma.plan.findFirst({
      where: { activo: true },
      orderBy: { createdAt: 'asc' },
      select: { maxConcurrentStreams: true },
    });

    return { max: plan?.maxConcurrentStreams ?? 3, policy: 'BLOCK_NEW' };
  }
}
