import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Audience, Session } from '../../domain/entities/session.entity';
import { SessionRepository } from '../../domain/interfaces/session.repository';

/**
 * In-memory session repository for development/testing.
 * Replace with Redis-backed repository for production.
 */
@Injectable()
export class InMemorySessionRepository implements SessionRepository, OnModuleInit {
  private readonly logger = new Logger(InMemorySessionRepository.name);
  private sessions: Map<string, Session> = new Map();

  onModuleInit(): void {
    const now = Date.now();
    const seeded: Session[] = [
      new Session({ id: 'ses-001', userId: 'usr-001', deviceId: 'android-tv-sala', audience: Audience.APP, refreshTokenHash: 'seed-001', createdAt: new Date(now - 2 * 60 * 60 * 1000), expiresAt: new Date(now + 5 * 24 * 60 * 60 * 1000) }),
      new Session({ id: 'ses-002', userId: 'usr-001', deviceId: 'iphone-juan', audience: Audience.APP, refreshTokenHash: 'seed-002', createdAt: new Date(now - 26 * 60 * 60 * 1000), expiresAt: new Date(now + 3 * 24 * 60 * 60 * 1000) }),
      new Session({ id: 'ses-003', userId: 'usr-002', deviceId: 'web-maria', audience: Audience.APP, refreshTokenHash: 'seed-003', createdAt: new Date(now - 6 * 60 * 60 * 1000), expiresAt: new Date(now + 6 * 24 * 60 * 60 * 1000) }),
      new Session({ id: 'ses-004', userId: 'usr-admin-001', deviceId: 'cms-admin-web', audience: Audience.CMS, refreshTokenHash: 'seed-004', createdAt: new Date(now - 90 * 60 * 1000), expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000) }),
      new Session({ id: 'ses-005', userId: 'usr-soporte-001', deviceId: 'cms-soporte-web', audience: Audience.CMS, refreshTokenHash: 'seed-005', createdAt: new Date(now - 4 * 60 * 60 * 1000), expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000) }),
    ];

    for (const session of seeded) {
      this.sessions.set(session.id, session);
    }
    this.logger.log(`Seeded ${seeded.length} sessions`);
  }

  async findById(id: string): Promise<Session | null> {
    return Promise.resolve(this.sessions.get(id) ?? null);
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const result: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        result.push(session);
      }
    }
    return Promise.resolve(result);
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshTokenHash === hash) {
        return Promise.resolve(session);
      }
    }
    return Promise.resolve(null);
  }

  async save(session: Session): Promise<Session> {
    this.sessions.set(session.id, session);
    return Promise.resolve(session);
  }

  async deleteById(id: string): Promise<void> {
    this.sessions.delete(id);
    this.logger.debug(`Session ${id} deleted`);
    return Promise.resolve();
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }
    this.logger.debug(`All sessions deleted for user ${userId}`);
    return Promise.resolve();
  }
}