import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

// Domain interfaces
import { USER_REPOSITORY } from './domain/interfaces/user.repository';
import { SESSION_REPOSITORY } from './domain/interfaces/session.repository';
import { ACCOUNT_REPOSITORY } from './domain/interfaces/account.repository';
import { TOKEN_SERVICE } from './domain/interfaces/token.service';
import { HASH_SERVICE } from './domain/interfaces/hash.service';
import { OTP_SERVICE } from './domain/interfaces/otp.service';
import { EMAIL_SERVICE } from './domain/interfaces/email.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/interfaces/password-reset-token.repository';
import { FIRST_ACCESS_TOKEN_REPOSITORY } from './domain/interfaces/first-access-token.repository';
import { LOGIN_ATTEMPT_REPOSITORY } from './domain/interfaces/login-attempt.repository';
import { AUDIT_LOG_REPOSITORY } from './domain/interfaces/audit-log.repository';
import { TEMPORARY_CODE_REPOSITORY } from './domain/interfaces/temporary-code.repository';

// Infrastructure
import { InMemoryUserRepository } from './infrastructure/repositories/in-memory-user.repository';
import { InMemorySessionRepository } from './infrastructure/repositories/in-memory-session.repository';
import { InMemoryAccountRepository } from './infrastructure/repositories/in-memory-account.repository';
import { InMemoryPasswordResetTokenRepository } from './infrastructure/repositories/in-memory-password-reset-token.repository';
import { InMemoryFirstAccessTokenRepository } from './infrastructure/repositories/in-memory-first-access-token.repository';
import { InMemoryLoginAttemptRepository } from './infrastructure/repositories/in-memory-login-attempt.repository';
import { InMemoryAuditLogRepository } from './infrastructure/repositories/in-memory-audit-log.repository';
import { InMemoryTemporaryCodeRepository } from './infrastructure/repositories/in-memory-temporary-code.repository';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { BcryptHashService } from './infrastructure/persistence/bcrypt-hash.service';
import { MockOtpService } from './infrastructure/persistence/mock-otp.service';
import { MockEmailService } from './infrastructure/persistence/mock-email.service';
import { NodemailerEmailService } from './infrastructure/persistence/nodemailer-email.service';

// Use Cases
import { LoginAppUseCase } from './application/use-cases/login-app.use-case';
import { CompleteLoginUseCase } from './application/use-cases/complete-login.use-case';
import { LoginCmsUseCase } from './application/use-cases/login-cms.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { ListActiveSessionsUseCase } from './application/use-cases/list-active-sessions.use-case';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case';
import { RequestOtpUseCase } from './application/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp.use-case';
import { InitQrLoginUseCase } from './application/use-cases/init-qr-login.use-case';
import { ConfirmQrLoginUseCase } from './application/use-cases/confirm-qr-login.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { CompleteFirstAccessUseCase } from './application/use-cases/complete-first-access.use-case';
import { CreateCmsUserUseCase } from './application/use-cases/create-cms-user.use-case';
import { SendRecoveryCodeUseCase } from './application/use-cases/send-recovery-code.use-case';
import { GenerateActivationCodeUseCase } from './application/use-cases/generate-activation-code.use-case';
import { ValidateCodeUseCase } from './application/use-cases/validate-code.use-case';
import { ActivateAccountUseCase } from './application/use-cases/activate-account.use-case';
import { ResetPasswordWithCodeUseCase } from './application/use-cases/reset-password-with-code.use-case';
import { RegisterAppUseCase } from './application/use-cases/register-app.use-case';

// Presentation
import { AuthController } from './presentation/controllers/auth.controller';

// External modules
import { BillingModule } from '../billing/billing.module';
import { CrmModule } from '../crm/crm.module';

/**
 * Authentication and session management module.
 *
 * Registers:
 * - Domain ports bound to infrastructure adapters (in-memory repos, JWT, bcrypt, mock OTP)
 * - All authentication use cases (login, OTP, refresh, logout, password change, sessions)
 * - Passport JWT strategy and guards
 *
 * Exports:
 * - TOKEN_SERVICE, HASH_SERVICE, USER_REPOSITORY, ACCOUNT_REPOSITORY
 *   for consumption by other modules (e.g. AdminModule).
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
    }),
    BillingModule,
    CrmModule,
  ],
  controllers: [AuthController],
  providers: [
    // Infrastructure bindings
    { provide: USER_REPOSITORY,                  useClass: InMemoryUserRepository },
    { provide: SESSION_REPOSITORY,               useClass: InMemorySessionRepository },
    { provide: ACCOUNT_REPOSITORY,               useClass: InMemoryAccountRepository },
    { provide: PASSWORD_RESET_TOKEN_REPOSITORY,  useClass: InMemoryPasswordResetTokenRepository },
    { provide: FIRST_ACCESS_TOKEN_REPOSITORY,    useClass: InMemoryFirstAccessTokenRepository },
    { provide: LOGIN_ATTEMPT_REPOSITORY,         useClass: InMemoryLoginAttemptRepository },
    { provide: AUDIT_LOG_REPOSITORY,             useClass: InMemoryAuditLogRepository },
    { provide: TEMPORARY_CODE_REPOSITORY,        useClass: InMemoryTemporaryCodeRepository },
    { provide: TOKEN_SERVICE,                    useClass: JwtTokenService },
    { provide: HASH_SERVICE,                     useClass: BcryptHashService },
    { provide: OTP_SERVICE,                      useClass: MockOtpService },
    { provide: EMAIL_SERVICE,                    useClass: NodemailerEmailService },
    JwtStrategy,

    // Use Cases
    LoginAppUseCase,
    CompleteLoginUseCase,
    LoginCmsUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetCurrentUserUseCase,
    ChangePasswordUseCase,
    ListActiveSessionsUseCase,
    RevokeSessionUseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    InitQrLoginUseCase,
    ConfirmQrLoginUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    CompleteFirstAccessUseCase,
    CreateCmsUserUseCase,
    SendRecoveryCodeUseCase,
    GenerateActivationCodeUseCase,
    ValidateCodeUseCase,
    ActivateAccountUseCase,
    ResetPasswordWithCodeUseCase,
    RegisterAppUseCase,
  ],
  exports: [
    TOKEN_SERVICE,
    HASH_SERVICE,
    USER_REPOSITORY,
    SESSION_REPOSITORY,
    ACCOUNT_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    FIRST_ACCESS_TOKEN_REPOSITORY,
    EMAIL_SERVICE,
    CreateCmsUserUseCase,
  ],
})
export class AuthModule {}
