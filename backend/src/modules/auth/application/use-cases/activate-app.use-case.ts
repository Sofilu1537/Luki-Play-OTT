import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service.js';
import type { TokenService } from '../../domain/interfaces/token.service.js';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service.js';
import type { HashService } from '../../domain/interfaces/hash.service.js';
import { ActivateAppDto } from '../dto/activate-app.dto.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ActivateAppUseCase2 {
  private readonly logger = new Logger(ActivateAppUseCase2.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async execute(dto: ActivateAppDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { contracts: { where: { deletedAt: null } } },
    });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (customer.isAccountActivated) {
      throw new BadRequestException('La cuenta ya fue activada');
    }

    const passwordHash = await this.hashService.hash(dto.password);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        isAccountActivated: true,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        ...(dto.email ? { email: dto.email } : {}),
      },
    });

    const contract = customer.contracts[0];
    if (!contract) {
      throw new BadRequestException('El cliente no tiene contratos activos');
    }

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
        deviceId: 'activation-device',
        audience: 'app',
        refreshToken: tokenPair.refreshToken,
        expiresAt: new Date(Date.now() + contract.sessionDurationDays * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Account activated: customer ${customer.id}`);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: customer.id,
        name: customer.nombre,
        email: dto.email ?? customer.email ?? '',
        plan: 'lukiplay',
      },
    };
  }
}
