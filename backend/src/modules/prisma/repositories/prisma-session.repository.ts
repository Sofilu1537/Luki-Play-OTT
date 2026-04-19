import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SessionRepository } from '../../auth/domain/interfaces/session.repository.js';
import { Session as DomainSession, Audience } from '../../auth/domain/entities/session.entity.js';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DomainSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { contract: true },
    });
    return session ? this.toDomain(session) : null;
  }

  async findByUserId(userId: string): Promise<DomainSession[]> {
    const sessions = await this.prisma.session.findMany({
      where: { contract: { customerId: userId } },
      include: { contract: true },
    });
    return sessions.map((s) => this.toDomain(s));
  }

  async findByRefreshTokenHash(hash: string): Promise<DomainSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: hash },
      include: { contract: true },
    });
    return session ? this.toDomain(session) : null;
  }

  async save(session: DomainSession): Promise<DomainSession> {
    const contractId = await this.resolveContractId(session.userId);

    const data = {
      deviceId: session.deviceId,
      audience: session.audience,
      refreshToken: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    };

    const saved = await this.prisma.session.upsert({
      where: { id: session.id },
      update: data,
      create: {
        id: session.id,
        contractId,
        ...data,
      },
      include: { contract: true },
    });

    return this.toDomain(saved);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.session.delete({ where: { id } }).catch(() => {
      // Session may already be deleted; ignore not-found
    });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    const contracts = await this.prisma.contract.findMany({
      where: { customerId: userId },
      select: { id: true },
    });

    if (contracts.length > 0) {
      await this.prisma.session.deleteMany({
        where: { contractId: { in: contracts.map((c) => c.id) } },
      });
    }
  }

  // ─── Private helpers ──────────────────────────────────────

  private async resolveContractId(userId: string): Promise<string> {
    const contract = await this.prisma.contract.findFirst({
      where: { customerId: userId },
      select: { id: true },
    });

    if (!contract) {
      throw new Error(`No contract found for customer ${userId}`);
    }

    return contract.id;
  }

  private toDomain(session: any): DomainSession {
    return new DomainSession({
      id: session.id,
      userId: session.contract?.customerId ?? session.contractId,
      deviceId: session.deviceId,
      audience: session.audience === 'cms' ? Audience.CMS : Audience.APP,
      refreshTokenHash: session.refreshToken ?? '',
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt,
    });
  }
}
