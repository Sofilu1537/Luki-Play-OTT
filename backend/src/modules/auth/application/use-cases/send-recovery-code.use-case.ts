import { Inject, Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service';
import type { EmailService } from '../../domain/interfaces/email.service';
import { TEMPORARY_CODE_REPOSITORY } from '../../domain/interfaces/temporary-code.repository';
import type { TemporaryCodeRepository } from '../../domain/interfaces/temporary-code.repository';
import {
  TemporaryCode,
  TemporaryCodeType,
} from '../../domain/entities/temporary-code.entity';

@Injectable()
export class SendRecoveryCodeUseCase {
  private readonly logger = new Logger(SendRecoveryCodeUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    @Inject(TEMPORARY_CODE_REPOSITORY)
    private readonly codeRepo: TemporaryCodeRepository,
  ) {}

  /**
   * @param email       Target email
   * @param requireCms  If true, only SUPERADMIN/SOPORTE users are allowed
   */
  async execute(email: string, requireCms = false): Promise<string> {
    const rawCode = randomBytes(4).toString('hex').toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepo.findByEmail(normalizedEmail);

    // CMS recovery: reject non-internal users with a clear message
    if (requireCms) {
      if (!user) {
        throw new ForbiddenException(
          'No se encontró un usuario interno con este correo.',
        );
      }
      if (!user.isCmsUser()) {
        throw new ForbiddenException(
          'Este correo no pertenece a un usuario interno autorizado.',
        );
      }
    }

    // Invalidate previous recovery codes for this email
    await this.codeRepo.invalidateByEmailAndType(
      normalizedEmail,
      TemporaryCodeType.RESET_PASSWORD,
    );

    // Persist the code (hashed) so it can be verified later
    const codeHash = createHash('sha256').update(rawCode).digest('hex');
    const temporaryCode = new TemporaryCode({
      id: randomUUID(),
      userId: user?.id ?? 'unknown',
      email: normalizedEmail,
      type: TemporaryCodeType.RESET_PASSWORD,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      createdAt: new Date(),
    });
    await this.codeRepo.save(temporaryCode);

    this.logger.log(`Recovery code generated for ${normalizedEmail}`);

    try {
      await this.emailService.sendRecoveryCode(
        normalizedEmail,
        rawCode,
        (user as any)?.nombre || (user as any)?.firstName || '',
      );
    } catch (err) {
      this.logger.error(
        `SMTP error for ${normalizedEmail}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      // Re-throw so the controller returns 500 instead of silent success
      throw err;
    }

    return rawCode;
  }
}
