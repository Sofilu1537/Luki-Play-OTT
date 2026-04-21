import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service.js';
import type { EmailService } from '../../domain/interfaces/email.service.js';
import { RequestActivationCodeDto } from '../dto/request-activation-code.dto.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutos

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

@Injectable()
export class RequestActivationCodeUseCase {
  private readonly logger = new Logger(RequestActivationCodeUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
  ) {}

  async execute(dto: RequestActivationCodeDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId, deletedAt: null },
    });

    if (!customer) throw new NotFoundException('Cliente no encontrado');

    // Invalidar códigos previos no usados para este customer
    await this.prisma.activationCode.updateMany({
      where: { customerId: dto.customerId, usedAt: null },
      data: { usedAt: new Date() }, // marca como usados para que no sean válidos
    });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await this.prisma.activationCode.create({
      data: {
        id: uuidv4(),
        customerId: dto.customerId,
        code,
        generatedBy: null, // autoservicio
        sentToEmail: dto.email ?? null,
        expiresAt,
      },
    });

    if (dto.email) {
      const displayName = customer.firstName ?? customer.nombre;
      try {
        await this.emailService.sendActivationCode(dto.email, code);
        this.logger.log(`Activation code sent to ${dto.email} for customer ${dto.customerId}`);
      } catch {
        this.logger.warn(`SMTP error sending activation code to ${dto.email} — code: ${code}`);
      }
      return { sent: true, message: `Código enviado a ${dto.email}` };
    }

    // Sin email: el abonado debe contactar a soporte
    return {
      sent: false,
      needsSupportCode: true,
      message: 'Contacte a soporte Luki para recibir su código de activación',
    };
  }
}
