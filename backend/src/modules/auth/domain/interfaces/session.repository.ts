import { Session } from '../entities/session.entity';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

/**
 * Port for session persistence operations.
 *
 * Implementations: {@link InMemorySessionRepository} (dev), future Redis-backed repo (prod).
 */
export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  findByRefreshTokenHash(hash: string): Promise<Session | null>;
  save(session: Session): Promise<Session>;
  deleteById(id: string): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
}
