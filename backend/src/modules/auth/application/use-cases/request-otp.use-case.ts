import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service';
import type { OtpService } from '../../domain/interfaces/otp.service';
import { RequestOtpDto } from '../dto/otp.dto';

/**
 * Sends (or resends) an OTP code to the user’s registered email.
 *
 * @throws NotFoundException when the contract number is not found or has no email.
 */
@Injectable()
export class RequestOtpUseCase {
  private readonly logger = new Logger(RequestOtpUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
  ) {}

  async execute(dto: RequestOtpDto): Promise<{ message: string }> {
    const user = await this.userRepo.findByContractNumber(dto.contractNumber);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.email) {
      throw new NotFoundException(
        'No email registered. Please contact support to register your email.',
      );
    }

    await this.otpService.generateAndSend(user.id, user.email);
    this.logger.log(`OTP requested for user ${user.id}`);
    return { message: 'OTP sent to registered email' };
  }
}