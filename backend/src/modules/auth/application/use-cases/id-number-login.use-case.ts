import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service.js';
import type { TokenService } from '../../domain/interfaces/token.service.js';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service.js';
import type { HashService } from '../../domain/interfaces/hash.service.js';
import { IdNumberLoginDto } from '../dto/id-number-login.dto.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IdNumberLoginUseCase {
  private readonly logger = new Logger(IdNumberLoginUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async execute(dto: IdNumberLoginDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { idNumber: dto.idNumber },
      include: {
        contracts: {
          where: { deletedAt: null },
          take: 1,
        },
      },
    });

    if (!customer || customer.deletedAt) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (customer.status !== 'ACTIVE') {
      throw new UnauthorizedException('La cuenta no está activa');
    }

    if (
      customer.isLocked &&
      customer.lockedUntil &&
      customer.lockedUntil > new Date()
    ) {
      throw new UnauthorizedException('Cuenta bloqueada temporalmente');
    }

    if (!customer.passwordHash) {
      throw new UnauthorizedException(
        'La cuenta no ha sido activada. Use "Primera vez" para configurar su contraseña.',
      );
    }

    if (!customer.isAccountActivated) {
      throw new UnauthorizedException(
        'La cuenta no ha sido activada. Use "Primera vez" para configurar su contraseña.',
      );
    }

    const passwordValid = await this.hashService.compare(
      dto.password,
      customer.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const contract = customer.contracts[0] ?? null;

    const tokenPair = await this.tokenService.generateTokenPair({
      sub: customer.id,
      role: customer.role.toLowerCase(),
      permissions: [],
      aud: 'app',
      accountId: contract?.id ?? null,
      entitlements: ['live-tv', 'vod-basic', 'sports'],
    });

    await this.prisma.session.create({
      data: {
        id: uuidv4(),
        customerId: customer.id,
        contractId: contract?.id ?? null,
        deviceId: dto.deviceId,
        audience: 'app',
        refreshToken: tokenPair.refreshToken,
        expiresAt: new Date(
          Date.now() + (contract?.sessionDurationDays ?? 30) * 24 * 60 * 60 * 1000,
        ),
      },
    });

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`ID login success: ${dto.idNumber} → customer ${customer.id}`);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      mustChangePassword: customer.mustChangePassword ?? false,
      user: {
        id: customer.id,
        name: customer.nombre,
        email: customer.email ?? '',
        plan: 'lukiplay',
      },
    };
  }
}
