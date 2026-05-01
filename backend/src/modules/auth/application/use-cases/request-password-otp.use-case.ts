import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service.js';
import type { OtpService } from '../../domain/interfaces/otp.service.js';
import { RequestPasswordOtpDto } from '../dto/request-password-otp.dto.js';

@Injectable()
export class RequestPasswordOtpUseCase {
  private readonly logger = new Logger(RequestPasswordOtpUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
  ) {}

  async execute(dto: RequestPasswordOtpDto): Promise<{ message: string }> {
    const message = 'Si existe una cuenta con ese correo, recibirás un código.';

    const customer = await this.prisma.customer.findFirst({
      where: { email: dto.email, deletedAt: null, isCmsUser: false },
    });

    if (!customer || customer.status !== 'ACTIVE') {
      return { message };
    }

    await this.otpService.generateAndSend(customer.id, customer.email!);
    this.logger.log(`Password reset OTP sent to customer ${customer.id}`);

    return { message };
  }
}
