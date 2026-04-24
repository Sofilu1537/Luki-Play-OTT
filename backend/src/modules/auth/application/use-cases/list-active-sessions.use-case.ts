import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { SessionResponse } from '../dto/auth-response.dto';

/**
 * Lists all non-expired sessions for a user.
 *
 * Used by the "Active Devices" screen to let the user see
 * where their account is currently logged in.
 */
@Injectable()
export class ListActiveSessionsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(userId: string): Promise<SessionResponse[]> {
    const sessions = await this.sessionRepo.findByUserId(userId);
    return sessions
      .filter((s) => !s.isExpired())
      .map((s) => ({
        id: s.id,
        deviceId: s.deviceId,
        audience: s.audience,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      }));
  }
}
