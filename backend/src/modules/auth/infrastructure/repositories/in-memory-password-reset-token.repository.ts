import { Injectable } from '@nestjs/common';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from '../../domain/interfaces/password-reset-token.repository';

@Injectable()
export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  private tokens: Map<string, PasswordResetToken> = new Map();

  async save(token: PasswordResetToken): Promise<PasswordResetToken> {
    this.tokens.set(token.id, token);
    return token;
  }

  async findByTokenHash(hash: string): Promise<PasswordResetToken | null> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash === hash) return token;
    }
    return null;
  }

  async markUsed(id: string): Promise<void> {
    const token = this.tokens.get(id);
    if (token) token.usedAt = new Date();
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, token] of this.tokens.entries()) {
      if (token.userId === userId) this.tokens.delete(id);
    }
  }
}
