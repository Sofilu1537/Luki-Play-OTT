import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FirstAccessAppDto } from '../dto/first-access-app.dto.js';

@Injectable()
export class FirstAccessAppUseCase {
  private readonly logger = new Logger(FirstAccessAppUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: FirstAccessAppDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { contractNumber: dto.contractNumber, deletedAt: null },
      include: { customer: true },
    });

    if (!contract || contract.customer.deletedAt) {
      throw new NotFoundException('No se encontró un contrato con ese número');
    }

    const customer = contract.customer;

    if (!customer.idNumber) {
      throw new BadRequestException('El contrato no tiene cédula registrada. Contacte a soporte.');
    }

    if (customer.idNumber !== dto.idNumber) {
      throw new BadRequestException('La cédula no coincide con el contrato');
    }

    if (customer.isAccountActivated) {
      throw new BadRequestException('Esta cuenta ya fue activada. Use "Iniciar sesión" con su contraseña.');
    }

    this.logger.log(`First access verified for contract ${dto.contractNumber}`);

    return {
      needsPasswordSetup: true,
      customerId: customer.id,
      contractNumber: contract.contractNumber,
      nombre: customer.nombre,
    };
  }
}
