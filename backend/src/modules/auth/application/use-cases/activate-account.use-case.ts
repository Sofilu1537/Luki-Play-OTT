import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { TEMPORARY_CODE_REPOSITORY } from '../../domain/interfaces/temporary-code.repository';
import type { TemporaryCodeRepository } from '../../domain/interfaces/temporary-code.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { TemporaryCodeType } from '../../domain/entities/temporary-code.entity';
import { UserStatus } from '../../domain/entities/user.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class ActivateAccountUseCase {
  private readonly logger = new Logger(ActivateAccountUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(TEMPORARY_CODE_REPOSITORY) private readonly codeRepo: TemporaryCodeRepository,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(email: string, rawCode: string, newPassword: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Buscar y validar código
    const codes = await this.codeRepo.findByEmailAndType(normalizedEmail, TemporaryCodeType.ACTIVATION);
    const match = codes.find((c) => c.isValid() && c.matchesCode(rawCode));

    if (!match) {
      throw new BadRequestException('Código inválido, expirado o ya utilizado.');
    }

    // Buscar usuario
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('No se encontró una cuenta asociada a ese correo.');
    }

    // Hashear password y activar cuenta
    const passwordHash = await this.hashService.hash(newPassword);
    user.passwordHash = passwordHash;
    user.status = UserStatus.ACTIVE;
    user.mustChangePassword = false;
    await this.userRepo.save(user);

    // Marcar código como usado
    await this.codeRepo.markUsed(match.id);

    // Auditoría
    await this.auditRepo.save(new AuditLog({
      id: randomUUID(),
      actorId: user.id,
      action: 'user.account_activated',
      targetId: user.id,
      targetType: 'user',
      metadata: { email: normalizedEmail },
      createdAt: new Date(),
    }));

    this.logger.log(`Account activated for ${normalizedEmail} (user ${user.id})`);
    return { message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.' };
  }
}
