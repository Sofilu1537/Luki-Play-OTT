import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service.js';
import type { OtpService } from '../../domain/interfaces/otp.service.js';
import { FirstAccessAppDto } from '../dto/first-access-app.dto.js';

@Injectable()
export class FirstAccessAppUseCase {
  private readonly logger = new Logger(FirstAccessAppUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
  ) {}

  async execute(dto: FirstAccessAppDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { idNumber: dto.idNumber },
    });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('No se encontró una cuenta con esa cédula');
    }

    if (customer.isAccountActivated) {
      throw new BadRequestException(
        'Esta cuenta ya fue activada. Usa "Iniciar sesión" con tu contraseña.',
      );
    }

    if (!customer.email) {
      throw new BadRequestException(
        'No tienes correo registrado. Contacta a soporte para activar tu cuenta.',
      );
    }

    await this.otpService.generateAndSend(customer.id, customer.email);

    this.logger.log(`First access OTP sent to customer ${customer.id}`);

    return {
      customerId: customer.id,
      nombre: customer.nombre,
    };
  }
}
