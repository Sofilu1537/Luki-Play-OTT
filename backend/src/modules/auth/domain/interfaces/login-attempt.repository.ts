import { LoginAttempt } from '../entities/login-attempt.entity';

export const LOGIN_ATTEMPT_REPOSITORY = Symbol('LOGIN_ATTEMPT_REPOSITORY');

export interface LoginAttemptRepository {
  save(attempt: LoginAttempt): Promise<void>;
  countRecentFailures(email: string, sinceMs: number): Promise<number>;
}
