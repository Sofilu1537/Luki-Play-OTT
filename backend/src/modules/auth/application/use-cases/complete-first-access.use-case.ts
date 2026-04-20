import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { FIRST_ACCESS_TOKEN_REPOSITORY } from '../../domain/interfaces/first-access-token.repository';
import type { FirstAccessTokenRepository } from '../../domain/interfaces/first-access-token.repository';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type { TokenService } from '../../domain/interfaces/token.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { Audience, Session } from '../../domain/entities/session.entity';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { AuthTokensResponse } from '../dto/auth-response.dto';

@Injectable()
export class CompleteFirstAccessUseCase {
  private readonly logger = new Logger(CompleteFirstAccessUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(FIRST_ACCESS_TOKEN_REPOSITORY) private readonly tokenRepo: FirstAccessTokenRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(rawToken: string, newPassword: string, deviceId: string): Promise<AuthTokensResponse> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const token = await this.tokenRepo.findByTokenHash(tokenHash);

    if (!token || !token.isValid()) {
      throw new BadRequestException('El enlace de activación es inválido o ha expirado.');
    }

    const user = await this.userRepo.findById(token.userId);
    if (!user || !user.isActive()) {
      throw new BadRequestException('El enlace de activación es inválido o ha expirado.');
    }

    const newHash = await this.hashService.hash(newPassword);
    await this.userRepo.updatePassword(user.id, newHash);
    await this.tokenRepo.markUsed(token.id);

    const permissions = getPermissionsForRole(user.role, user.dynamicPermissions);
    const tokenPair = await this.tokenService.generateTokenPair({
      sub: user.id,
      role: user.role,
      permissions,
      aud: Audience.CMS,
      accountId: null,
      entitlements: [],
    });

    const refreshTokenHash = await this.hashService.hash(tokenPair.refreshToken);
    const session = new Session({
      id: randomUUID(),
      userId: user.id,
      deviceId,
      audience: Audience.CMS,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
    await this.sessionRepo.save(session);

    await this.auditRepo.save(new AuditLog({
      id: randomUUID(),
      actorId: user.id,
      action: 'user.first_access_completed',
      targetId: user.id,
      targetType: 'user',
      metadata: {},
      createdAt: new Date(),
    }));

    this.logger.log(`First access completed for user ${user.id}`);
    return { accessToken: tokenPair.accessToken, refreshToken: tokenPair.refreshToken, canAccessOtt: true, restrictionMessage: null };
  }
}
