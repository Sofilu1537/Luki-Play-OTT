import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { TEMPORARY_CODE_REPOSITORY } from '../../domain/interfaces/temporary-code.repository';
import type { TemporaryCodeRepository } from '../../domain/interfaces/temporary-code.repository';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service';
import type { EmailService } from '../../domain/interfaces/email.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { TemporaryCode, TemporaryCodeType } from '../../domain/entities/temporary-code.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class GenerateActivationCodeUseCase {
  private readonly logger = new Logger(GenerateActivationCodeUseCase.name);

  constructor(
    @Inject(TEMPORARY_CODE_REPOSITORY) private readonly codeRepo: TemporaryCodeRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(userId: string, email: string, actorId: string): Promise<{ code: string }> {
    // Invalidar códigos anteriores
    await this.codeRepo.invalidateByEmailAndType(email, TemporaryCodeType.ACTIVATION);

    // Generar código alfanumérico de 8 caracteres
    const rawCode = randomBytes(4).toString('hex').toUpperCase();
    const codeHash = createHash('sha256').update(rawCode).digest('hex');

    const temporaryCode = new TemporaryCode({
      id: randomUUID(),
      userId,
      email: email.trim().toLowerCase(),
      type: TemporaryCodeType.ACTIVATION,
      codeHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      createdAt: new Date(),
    });

    await this.codeRepo.save(temporaryCode);

    try {
      await this.emailService.sendActivationCode(email, rawCode);
    } catch (err) {
      this.logger.warn(`SMTP error — code: ${rawCode}. Error: ${(err as Error).message}`);
    }

    await this.auditRepo.save(new AuditLog({
      id: randomUUID(),
      actorId,
      action: 'user.activation_code_generated',
      targetId: userId,
      targetType: 'user',
      metadata: { email },
      createdAt: new Date(),
    }));

    this.logger.log(`Activation code generated for ${email} (user ${userId})`);
    return { code: rawCode };
  }
}
