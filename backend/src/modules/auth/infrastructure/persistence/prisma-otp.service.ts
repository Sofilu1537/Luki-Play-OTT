import { Inject, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service.js';
import type { EmailService } from '../../domain/interfaces/email.service.js';
import type { OtpService } from '../../domain/interfaces/otp.service.js';

/**
 * Production OTP service: uses the same 6-char alphanumeric code mechanism as
 * admin recovery codes. The code is bcrypt-hashed and stored as passwordHash on
 * the customer so it can also be used as a temporary login password.
 * mustChangePassword is set to true so the app forces a password change on login.
 */
@Injectable()
export class PrismaOtpService implements OtpService {
  private readonly logger = new Logger(PrismaOtpService.name);
  private readonly CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
  ) {}

  async generateAndSend(customerId: string, email: string): Promise<void> {
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += this.CHARS[bytes[i] % this.CHARS.length];
    }

    const passwordHash = await bcrypt.hash(code, 10);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { firstName: true, lastName: true },
    });

    const displayName = customer?.firstName
      ? `${customer.firstName} ${customer.lastName ?? ''}`.trim()
      : email.split('@')[0];

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        passwordHash,
        mustChangePassword: true,
        isAccountActivated: true,
        isLocked: false,
        lockedUntil: null,
      },
    });

    try {
      await this.emailService.sendRecoveryCode(email, code, displayName);
      this.logger.log(`OTP sent to ${email} for customer ${customerId}`);
    } catch (err) {
      this.logger.warn(
        `OTP email delivery failed for ${email}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async verify(customerId: string, code: string): Promise<boolean> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { passwordHash: true, mustChangePassword: true },
    });

    if (!customer?.passwordHash || !customer.mustChangePassword) {
      return false;
    }

    return bcrypt.compare(code, customer.passwordHash);
  }
}
