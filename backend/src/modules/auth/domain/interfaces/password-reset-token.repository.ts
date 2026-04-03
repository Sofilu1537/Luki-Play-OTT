import { PasswordResetToken } from '../entities/password-reset-token.entity';

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY');

export interface PasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<PasswordResetToken>;
  findByTokenHash(hash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
