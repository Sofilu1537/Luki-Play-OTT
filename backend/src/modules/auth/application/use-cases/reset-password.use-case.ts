import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/interfaces/password-reset-token.repository';
import type { PasswordResetTokenRepository } from '../../domain/interfaces/password-reset-token.repository';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) private readonly tokenRepo: PasswordResetTokenRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const token = await this.tokenRepo.findByTokenHash(tokenHash);

    if (!token || !token.isValid()) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado.');
    }

    const user = await this.userRepo.findById(token.userId);
    if (!user || !user.isActive()) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado.');
    }

    const newHash = await this.hashService.hash(newPassword);
    await this.userRepo.updatePassword(user.id, newHash);
    await this.tokenRepo.markUsed(token.id);
    await this.sessionRepo.deleteAllByUserId(user.id);

    await this.auditRepo.save(new AuditLog({
      id: randomUUID(),
      actorId: user.id,
      action: 'password.reset',
      targetId: user.id,
      targetType: 'user',
      metadata: { method: 'recovery_link' },
      createdAt: new Date(),
    }));

    this.logger.log(`Password reset completed for user ${user.id}, all sessions revoked`);
  }
}
