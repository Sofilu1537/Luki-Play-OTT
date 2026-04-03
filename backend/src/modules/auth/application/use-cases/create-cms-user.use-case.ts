import { Inject, Injectable, ConflictException, Logger } from '@nestjs/common';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { FIRST_ACCESS_TOKEN_REPOSITORY } from '../../domain/interfaces/first-access-token.repository';
import type { FirstAccessTokenRepository } from '../../domain/interfaces/first-access-token.repository';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service';
import type { EmailService } from '../../domain/interfaces/email.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { FirstAccessToken } from '../../domain/entities/first-access-token.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';

export interface CreateCmsUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole.SUPERADMIN | UserRole.SOPORTE;
  phone?: string;
  createdBy: string;
}

@Injectable()
export class CreateCmsUserUseCase {
  private readonly logger = new Logger(CreateCmsUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(FIRST_ACCESS_TOKEN_REPOSITORY) private readonly tokenRepo: FirstAccessTokenRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: CreateCmsUserDto): Promise<{ id: string; email: string }> {
    const existing = await this.userRepo.findByEmail(dto.email.trim().toLowerCase());
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese correo electrónico.');
    }

    // Placeholder hash — user will set real password on first access
    const placeholderHash = await this.hashService.hash(randomBytes(32).toString('hex'));

    const user = new User({
      id: `usr-${randomUUID().slice(0, 8)}`,
      contractNumber: null,
      email: dto.email.trim().toLowerCase(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone ?? null,
      passwordHash: placeholderHash,
      role: dto.role,
      status: UserStatus.ACTIVE,
      accountId: null,
      createdAt: new Date(),
      mustChangePassword: true,
      createdBy: dto.createdBy,
    });

    await this.userRepo.save(user);

    // Generate first-access token (24h, single use)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const accessToken = new FirstAccessToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    await this.tokenRepo.save(accessToken);

    const cmsUrl = this.configService.get<string>('CMS_URL', 'http://localhost:3001');
    const link = `${cmsUrl}/first-access?token=${rawToken}`;

    await this.emailService.sendFirstAccess(user.email, link, user.displayName());

    await this.auditRepo.save(new AuditLog({
      id: randomUUID(),
      actorId: dto.createdBy,
      action: 'user.created',
      targetId: user.id,
      targetType: 'user',
      metadata: { role: dto.role, email: user.email },
      createdAt: new Date(),
    }));

    this.logger.log(`CMS user created: ${user.id} (${dto.role}) by ${dto.createdBy}`);
    return { id: user.id, email: user.email };
  }
}
