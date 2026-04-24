import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { TEMPORARY_CODE_REPOSITORY } from '../../domain/interfaces/temporary-code.repository';
import type { TemporaryCodeRepository } from '../../domain/interfaces/temporary-code.repository';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { TemporaryCodeType } from '../../domain/entities/temporary-code.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class ResetPasswordWithCodeUseCase {
  private readonly logger = new Logger(ResetPasswordWithCodeUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(TEMPORARY_CODE_REPOSITORY)
    private readonly codeRepo: TemporaryCodeRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(
    email: string,
    rawCode: string,
    newPassword: string,
    requireCms = false,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    // Find valid recovery codes for this email
    const codes = await this.codeRepo.findByEmailAndType(
      normalizedEmail,
      TemporaryCodeType.RESET_PASSWORD,
    );
    const match = codes.find((c) => c.isValid() && c.matchesCode(rawCode));

    if (!match) {
      throw new BadRequestException(
        'Código inválido, expirado o ya utilizado.',
      );
    }

    // Find user
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException(
        'No se encontró un usuario con este correo.',
      );
    }

    // CMS-only path: reject non-internal users
    if (requireCms && !user.isCmsUser()) {
      throw new ForbiddenException(
        'Este correo no pertenece a un usuario interno autorizado.',
      );
    }

    // Hash new password and update
    const passwordHash = await this.hashService.hash(newPassword);
    await this.userRepo.updatePassword(user.id, passwordHash);

    // Mark code as used
    await this.codeRepo.markUsed(match.id);

    // Revoke all sessions for security
    await this.sessionRepo.deleteAllByUserId(user.id);

    // Audit log
    await this.auditRepo.save(
      new AuditLog({
        id: randomUUID(),
        actorId: user.id,
        action: 'user.password_reset_with_code',
        targetId: user.id,
        targetType: 'user',
        metadata: { email: normalizedEmail },
        createdAt: new Date(),
      }),
    );

    this.logger.log(
      `Password reset via code for ${normalizedEmail} (user ${user.id})`,
    );
  }
}
