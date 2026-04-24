import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { VerifyActivationCodeDto } from '../dto/verify-activation-code.dto.js';

@Injectable()
export class VerifyActivationCodeUseCase {
  private readonly logger = new Logger(VerifyActivationCodeUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: VerifyActivationCodeDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId, deletedAt: null },
    });

    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const activation = await this.prisma.activationCode.findFirst({
      where: {
        customerId: dto.customerId,
        code: dto.code.toUpperCase(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!activation) {
      throw new BadRequestException('Código inválido o expirado');
    }

    this.logger.log(`Activation code verified for customer ${dto.customerId}`);
    return { verified: true };
  }
}
