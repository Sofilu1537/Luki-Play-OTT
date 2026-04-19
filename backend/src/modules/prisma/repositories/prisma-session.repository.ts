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
      where: {
        OR: [
          { contract: { customerId: userId } },
          { customerId: userId },
        ],
      },
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

    const existing = await this.prisma.session.findUnique({ where: { id: session.id } });

    let saved: any;
    if (existing) {
      saved = await this.prisma.session.update({
        where: { id: session.id },
        data: {
          deviceId: session.deviceId,
          audience: session.audience,
          refreshToken: session.refreshTokenHash,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
        },
        include: { contract: true },
      });
    } else {
      saved = await this.prisma.session.create({
        data: {
          id: session.id,
          deviceId: session.deviceId,
          audience: session.audience,
          refreshToken: session.refreshTokenHash,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
          customer: { connect: { id: session.userId } },
          ...(contractId ? { contract: { connect: { id: contractId } } } : {}),
        },
        include: { contract: true },
      });
    }

    return this.toDomain(saved);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.session.delete({ where: { id } }).catch(() => {
      // Session may already be deleted; ignore not-found
    });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        OR: [
          { contract: { customerId: userId } },
          { customerId: userId },
        ],
      },
    });
  }

  // ─── Private helpers ──────────────────────────────────────

  private async resolveContractId(userId: string): Promise<string | null> {
    const contract = await this.prisma.contract.findFirst({
      where: { customerId: userId },
      select: { id: true },
    });

    return contract?.id ?? null;
  }

  private toDomain(session: any): DomainSession {
    return new DomainSession({
      id: session.id,
      userId: session.contract?.customerId ?? session.customerId ?? '',
      deviceId: session.deviceId,
      audience: session.audience === 'cms' ? Audience.CMS : Audience.APP,
      refreshTokenHash: session.refreshToken ?? '',
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt,
    });
  }
}
