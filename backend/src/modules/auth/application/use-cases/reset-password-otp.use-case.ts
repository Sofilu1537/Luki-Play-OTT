import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service.js';
import type { OtpService } from '../../domain/interfaces/otp.service.js';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service.js';
import type { HashService } from '../../domain/interfaces/hash.service.js';
import { ResetPasswordOtpDto } from '../dto/reset-password-otp.dto.js';

@Injectable()
export class ResetPasswordOtpUseCase {
  private readonly logger = new Logger(ResetPasswordOtpUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async execute(dto: ResetPasswordOtpDto): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { idNumber: dto.idNumber },
    });

    if (!customer || customer.deletedAt || customer.status !== 'ACTIVE') {
      throw new BadRequestException('Código o cédula inválidos');
    }

    const otpValid = await this.otpService.verify(customer.id, dto.otpCode);
    if (!otpValid) {
      throw new BadRequestException('Código OTP inválido o expirado');
    }

    const passwordHash = await this.hashService.hash(dto.newPassword);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash },
    });

    // Revocar todas las sesiones activas del customer
    const contractIds = await this.prisma.contract.findMany({
      where: { customerId: customer.id, deletedAt: null },
      select: { id: true },
    });

    await this.prisma.session.updateMany({
      where: {
        OR: [
          { customerId: customer.id },
          { contractId: { in: contractIds.map((c) => c.id) } },
        ],
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Password reset via OTP for customer ${customer.id}`);

    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
