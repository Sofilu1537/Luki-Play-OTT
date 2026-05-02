import {
  Injectable, Inject, BadRequestException,
  UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HASH_SERVICE } from '../auth/domain/interfaces/hash.service';
import type { HashService } from '../auth/domain/interfaces/hash.service';

const PIN_REGEX = /^\d{4}$/;

@Injectable()
export class ParentalControlService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async getStatus(customerId: string): Promise<{ enabled: boolean; level: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { parentalControlEnabled: true, parentalControlLevel: true },
    });
    if (!customer) throw new NotFoundException('Usuario no encontrado');
    return { enabled: customer.parentalControlEnabled, level: customer.parentalControlLevel ?? 'ALL' };
  }

  async enable(customerId: string, pin: string, level = 'FAMILY'): Promise<void> {
    if (!PIN_REGEX.test(pin)) {
      throw new BadRequestException('El PIN debe ser de 4 dígitos numéricos');
    }
    const pinHash = await this.hashService.hash(pin);
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { parentalControlEnabled: true, parentalControlPin: pinHash, parentalControlLevel: level },
    });
  }

  async disable(customerId: string, pin: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { parentalControlEnabled: true, parentalControlPin: true },
    });
    if (!customer) throw new NotFoundException('Usuario no encontrado');
    if (!customer.parentalControlEnabled) {
      throw new BadRequestException('El control parental no está activado');
    }
    await this.verifyOrThrow(pin, customer.parentalControlPin);
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { parentalControlEnabled: false, parentalControlPin: null },
    });
  }

  async updateLevel(customerId: string, level: string): Promise<void> {
    const valid = ['KIDS', 'FAMILY', 'TEEN', 'ALL'];
    if (!valid.includes(level)) throw new BadRequestException('Nivel de restricción inválido');
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { parentalControlLevel: level },
    });
  }

  async verifyPin(customerId: string, pin: string): Promise<{ valid: boolean }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { parentalControlEnabled: true, parentalControlPin: true },
    });
    if (!customer || !customer.parentalControlEnabled || !customer.parentalControlPin) {
      return { valid: true }; // no parental control active → all content accessible
    }
    const valid = await this.hashService.compare(pin, customer.parentalControlPin);
    return { valid };
  }

  async changePin(customerId: string, currentPin: string, newPin: string): Promise<void> {
    if (!PIN_REGEX.test(newPin)) {
      throw new BadRequestException('El nuevo PIN debe ser de 4 dígitos numéricos');
    }
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { parentalControlEnabled: true, parentalControlPin: true },
    });
    if (!customer) throw new NotFoundException('Usuario no encontrado');
    if (!customer.parentalControlEnabled) {
      throw new BadRequestException('El control parental no está activado');
    }
    await this.verifyOrThrow(currentPin, customer.parentalControlPin);
    const newHash = await this.hashService.hash(newPin);
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { parentalControlPin: newHash },
    });
  }

  private async verifyOrThrow(pin: string, hash: string | null): Promise<void> {
    if (!hash) throw new UnauthorizedException('PIN no configurado');
    const valid = await this.hashService.compare(pin, hash);
    if (!valid) throw new UnauthorizedException('PIN incorrecto');
  }
}
