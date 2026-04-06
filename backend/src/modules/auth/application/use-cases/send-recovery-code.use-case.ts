import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service';
import type { EmailService } from '../../domain/interfaces/email.service';

@Injectable()
export class SendRecoveryCodeUseCase {
  private readonly logger = new Logger(SendRecoveryCodeUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
  ) {}

  async execute(email: string): Promise<string> {
    const code = randomBytes(4).toString('hex').toUpperCase(); // 8-char alphanumeric

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      this.logger.warn(`Email ${email} not in local repo — sending code anyway (mock/external data)`);
    }

    this.logger.log(`Recovery code for ${email}: ${code}`);

    try {
      await this.emailService.sendRecoveryCode(email, code);
    } catch (err) {
      this.logger.warn(`SMTP error — code logged above. Error: ${(err as Error).message}`);
    }

    return code;
  }
}
