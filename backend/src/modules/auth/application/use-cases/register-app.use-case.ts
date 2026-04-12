import { Inject, Injectable, ConflictException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service';
import type { OtpService } from '../../domain/interfaces/otp.service';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type { TokenService } from '../../domain/interfaces/token.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { Audience } from '../../domain/entities/session.entity';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { RegisterAppDto } from '../dto/register-app.dto';

@Injectable()
export class RegisterAppUseCase {
  private readonly logger = new Logger(RegisterAppUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(dto: RegisterAppDto): Promise<{ message: string; loginToken: string; otpRequired: boolean }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo electrónico.');
    }

    const nameParts = dto.nombre.trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || null;

    const passwordHash = await this.hashService.hash(dto.password);

    const user = new User({
      id: `usr-${randomUUID().slice(0, 8)}`,
      contractNumber: null,
      email: normalizedEmail,
      firstName,
      lastName,
      passwordHash,
      role: UserRole.CLIENTE,
      status: UserStatus.ACTIVE,
      accountId: null,
      createdAt: new Date(),
      mustChangePassword: false,
      mfaEnabled: false,
    });

    await this.userRepo.save(user);

    await this.auditRepo.save(new AuditLog({
      id: randomUUID(),
      actorId: user.id,
      action: 'user.self_registered',
      targetId: user.id,
      targetType: 'user',
      metadata: { email: normalizedEmail },
      createdAt: new Date(),
    }));

    // Send OTP and generate loginToken to continue into the verify-otp flow
    await this.otpService.generateAndSend(user.id, normalizedEmail);
    const loginToken = await this.tokenService.generateLoginChallenge({
      sub: user.id,
      deviceId: 'web',
      aud: Audience.APP,
    });

    this.logger.log(`New subscriber registered: ${normalizedEmail} (${user.id})`);
    return {
      message: 'Cuenta creada. Revisa tu correo para el código de verificación.',
      loginToken,
      otpRequired: true,
    };
  }
}
