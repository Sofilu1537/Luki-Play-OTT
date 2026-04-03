import { Injectable } from '@nestjs/common';
import { FirstAccessToken } from '../../domain/entities/first-access-token.entity';
import { FirstAccessTokenRepository } from '../../domain/interfaces/first-access-token.repository';

@Injectable()
export class InMemoryFirstAccessTokenRepository implements FirstAccessTokenRepository {
  private tokens: Map<string, FirstAccessToken> = new Map();

  async save(token: FirstAccessToken): Promise<FirstAccessToken> {
    this.tokens.set(token.id, token);
    return token;
  }

  async findByTokenHash(hash: string): Promise<FirstAccessToken | null> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash === hash) return token;
    }
    return null;
  }

  async markUsed(id: string): Promise<void> {
    const token = this.tokens.get(id);
    if (token) token.usedAt = new Date();
  }
}
