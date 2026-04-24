import { FirstAccessToken } from '../entities/first-access-token.entity';

export const FIRST_ACCESS_TOKEN_REPOSITORY = Symbol(
  'FIRST_ACCESS_TOKEN_REPOSITORY',
);

export interface FirstAccessTokenRepository {
  save(token: FirstAccessToken): Promise<FirstAccessToken>;
  findByTokenHash(hash: string): Promise<FirstAccessToken | null>;
  markUsed(id: string): Promise<void>;
}
