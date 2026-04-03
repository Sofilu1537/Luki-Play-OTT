import { Injectable } from '@nestjs/common';
import { LoginAttempt } from '../../domain/entities/login-attempt.entity';
import { LoginAttemptRepository } from '../../domain/interfaces/login-attempt.repository';

@Injectable()
export class InMemoryLoginAttemptRepository implements LoginAttemptRepository {
  private attempts: LoginAttempt[] = [];

  async save(attempt: LoginAttempt): Promise<void> {
    this.attempts.push(attempt);
    // Keep only last 10000 records
    if (this.attempts.length > 10000) this.attempts.shift();
  }

  async countRecentFailures(email: string, sinceMs: number): Promise<number> {
    const since = new Date(Date.now() - sinceMs);
    return this.attempts.filter(
      (a) => a.email.toLowerCase() === email.toLowerCase() &&
             !a.succeeded &&
             a.createdAt > since,
    ).length;
  }
}
