import { Inject, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service.js';
import type { TokenService } from '../../domain/interfaces/token.service.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SwitchContractUseCase {
  private readonly logger = new Logger(SwitchContractUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(customerId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      include: { customer: true },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.customerId !== customerId) {
      throw new ForbiddenException('El contrato no pertenece a este cliente');
    }

    const customer = contract.customer;

    const tokenPair = await this.tokenService.generateTokenPair({
      sub: customer.id,
      role: customer.role.toLowerCase(),
      permissions: [],
      aud: 'app',
      accountId: contract.id,
      entitlements: ['live-tv', 'vod-basic', 'sports'],
    });

    await this.prisma.session.create({
      data: {
        id: uuidv4(),
        contractId: contract.id,
        deviceId: 'switch-device',
        audience: 'app',
        refreshToken: tokenPair.refreshToken,
        expiresAt: new Date(Date.now() + contract.sessionDurationDays * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Contract switched: customer ${customerId} → contract ${contractId}`);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: customer.id,
        name: customer.nombre,
        email: customer.email ?? '',
        plan: 'lukiplay',
      },
    };
  }
}
