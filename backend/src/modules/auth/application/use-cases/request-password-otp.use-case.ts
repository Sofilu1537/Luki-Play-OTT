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
    const message = 'Si existe un usuario con esa cédula, recibirás un código por correo.';

    const customer = await this.prisma.customer.findUnique({
      where: { idNumber: dto.idNumber },
    });

    if (!customer || customer.deletedAt || customer.status !== 'ACTIVE') {
      // Anti-enumeración: siempre responder igual
      return { message };
    }

    if (customer.email) {
      await this.otpService.generateAndSend(customer.id, customer.email);
      this.logger.log(`Password reset OTP sent to customer ${customer.id}`);
    } else {
      this.logger.warn(`Password reset OTP requested but no email for customer ${customer.id}`);
    }

    return { message };
  }
}
