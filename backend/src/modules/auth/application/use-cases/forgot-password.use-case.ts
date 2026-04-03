import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/interfaces/password-reset-token.repository';
import type { PasswordResetTokenRepository } from '../../domain/interfaces/password-reset-token.repository';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service';
import type { EmailService } from '../../domain/interfaces/email.service';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) private readonly tokenRepo: PasswordResetTokenRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(email: string): Promise<void> {
    // Anti-timing: always takes ~same time regardless of whether user exists
    const user = await this.userRepo.findByEmail(email.trim().toLowerCase());

    if (user && user.isActive() && user.isCmsUser()) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      await this.tokenRepo.deleteByUserId(user.id); // invalidate previous tokens

      const token = new PasswordResetToken({
        id: randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        createdAt: new Date(),
      });

      await this.tokenRepo.save(token);

      const cmsUrl = this.configService.get<string>('CMS_URL', 'http://localhost:3001');
      const resetLink = `${cmsUrl}/reset-password?token=${rawToken}`;

      await this.emailService.sendPasswordReset(
        user.email,
        resetLink,
        user.displayName(),
      );

      this.logger.log(`Password reset requested for user ${user.id}`);
    }
    // Always return void — no signal about whether user exists
  }
}
