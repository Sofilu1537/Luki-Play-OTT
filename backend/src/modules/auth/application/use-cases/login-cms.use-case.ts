import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type { TokenService } from '../../domain/interfaces/token.service';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { LOGIN_ATTEMPT_REPOSITORY } from '../../domain/interfaces/login-attempt.repository';
import type { LoginAttemptRepository } from '../../domain/interfaces/login-attempt.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/interfaces/audit-log.repository';
import type { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';
import { Audience, Session } from '../../domain/entities/session.entity';
import { LoginAttempt } from '../../domain/entities/login-attempt.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { LoginCmsDto } from '../dto/login-cms.dto';
import { AuthTokensResponse } from '../dto/auth-response.dto';

const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Single-phase CMS login for admin/support staff.
 *
 * Validates email + password, verifies the user has a CMS role
 * (SUPERADMIN or SOPORTE), and issues a JWT token pair.
 * No OTP step is required for CMS access.
 *
 * @throws UnauthorizedException when credentials are invalid or role is CLIENTE.
 */
@Injectable()
export class LoginCmsUseCase {
  private readonly logger = new Logger(LoginCmsUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(LOGIN_ATTEMPT_REPOSITORY) private readonly attemptRepo: LoginAttemptRepository,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(dto: LoginCmsDto, ipAddress?: string): Promise<AuthTokensResponse> {
    const email = dto.email.trim().toLowerCase();

    // 1. Rate-limit check (anti-enumeration: check before user lookup)
    const recentFailures = await this.attemptRepo.countRecentFailures(email, FAILURE_WINDOW_MS);
    if (recentFailures >= MAX_FAILURES) {
      this.logger.warn(`CMS login blocked (rate limit): ${email}`);
      throw new UnauthorizedException(
        `Demasiados intentos fallidos. Espera ${FAILURE_WINDOW_MS / 60000} minutos e intenta de nuevo.`,
      );
    }

    const recordFailure = (reason: string) =>
      this.attemptRepo.save(new LoginAttempt({
        id: randomUUID(), email, ipAddress: ipAddress ?? null,
        succeeded: false, failureReason: reason, createdAt: new Date(),
      }));

    // 2. Find user
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      await recordFailure('user_not_found');
      this.logger.warn(`CMS login failed: email not found ${email}`);
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    if (!user.isActive()) {
      await recordFailure('account_inactive');
      throw new UnauthorizedException('Tu cuenta está inactiva. Contacta al administrador.');
    }

    if (!user.isCmsUser()) {
      await recordFailure('not_cms_user');
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    // 3. Verify password
    const passwordValid = await this.hashService.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await recordFailure('invalid_password');
      this.logger.warn(`CMS login failed: invalid password for user ${user.id}`);
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    // 4. Record success + update user stats
    await this.attemptRepo.save(new LoginAttempt({
      id: randomUUID(), email, ipAddress: ipAddress ?? null,
      succeeded: true, createdAt: new Date(),
    }));
    user.lastLoginAt = new Date();
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await this.userRepo.save(user);

    // 5. Audit
    await this.auditRepo.save(new AuditLog({
      id: randomUUID(), actorId: user.id, action: 'auth.login',
      targetId: user.id, targetType: 'user',
      metadata: { role: user.role }, ipAddress: ipAddress ?? null, createdAt: new Date(),
    }));

    // 6. Generate session
    const permissions = getPermissionsForRole(user.role);
    const tokenPair = await this.tokenService.generateTokenPair({
      sub: user.id, role: user.role, permissions,
      aud: Audience.CMS, accountId: null, entitlements: [],
    });

    const refreshTokenHash = await this.hashService.hash(tokenPair.refreshToken);
    await this.sessionRepo.save(new Session({
      id: randomUUID(), userId: user.id, deviceId: dto.deviceId,
      audience: Audience.CMS, refreshTokenHash,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      createdAt: new Date(),
    }));

    this.logger.log(`CMS user ${user.id} (${user.role}) logged in`);
    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      canAccessOtt: true,
      restrictionMessage: null,
    };
  }
}
