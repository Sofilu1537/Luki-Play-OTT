import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service.js';
import type { HashService } from '../../domain/interfaces/hash.service.js';
import { ContractResetPasswordDto } from '../dto/contract-reset-password.dto.js';

@Injectable()
export class ContractResetPasswordUseCase {
  private readonly logger = new Logger(ContractResetPasswordUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async execute(dto: ContractResetPasswordDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { contractNumber: dto.contractNumber, deletedAt: null },
      include: { customer: true },
    });

    if (!contract || contract.customer.deletedAt) {
      throw new NotFoundException('No se encontró un contrato con ese número');
    }

    const customer = contract.customer;

    if (!customer.idNumber || customer.idNumber !== dto.idNumber) {
      throw new BadRequestException('La cédula no coincide con el contrato');
    }

    const passwordHash = await this.hashService.hash(dto.newPassword);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash },
    });

    const contractIds = await this.prisma.contract.findMany({
      where: { customerId: customer.id, deletedAt: null },
      select: { id: true },
    });

    await this.prisma.session.updateMany({
      where: {
        contractId: { in: contractIds.map(c => c.id) },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Password reset via contract: ${dto.contractNumber}`);

    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
