import { Injectable, ConflictException, Logger, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { SubmitRegistrationRequestDto } from '../dto/submit-registration-request.dto.js';
import type { EmailService } from '../../domain/interfaces/email.service.js';
import { EMAIL_SERVICE } from '../../domain/interfaces/email.service.js';

@Injectable()
export class SubmitRegistrationRequestUseCase {
  private readonly logger = new Logger(SubmitRegistrationRequestUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
  ) {}

  async execute(dto: SubmitRegistrationRequestDto) {
    // Verificar que no sea ya un cliente del ISP
    const existing = await this.prisma.customer.findUnique({
      where: { idNumber: dto.idNumber },
    });
    if (existing) {
      throw new ConflictException(
        'Tu cédula ya está registrada como cliente de Luki. Usa la opción "Activar cuenta".',
      );
    }

    // Verificar que no tenga una solicitud pendiente
    const pendingRequest = await this.prisma.registrationRequest.findFirst({
      where: { idNumber: dto.idNumber, status: 'PENDING' },
    });
    if (pendingRequest) {
      throw new ConflictException(
        'Ya tienes una solicitud pendiente de revisión. Te contactaremos pronto.',
      );
    }

    const request = await this.prisma.registrationRequest.create({
      data: {
        id: uuidv4(),
        nombres: dto.nombres.trim(),
        apellidos: dto.apellidos.trim(),
        idNumber: dto.idNumber.trim(),
        telefono: dto.telefono.trim(),
        email: dto.email?.trim() ?? null,
        direccion: dto.direccion?.trim() ?? null,
      },
    });

    this.logger.log(`Registration request submitted: ${request.id} (cédula: ${dto.idNumber})`);

    this.emailService.sendRegistrationRequest({
      nombres: request.nombres,
      apellidos: request.apellidos,
      idNumber: request.idNumber,
      telefono: request.telefono,
      email: request.email ?? undefined,
      direccion: request.direccion ?? undefined,
      requestId: request.id,
    }).catch((err) => this.logger.warn(`Email notification failed for request ${request.id}: ${err.message}`));

    return { message: 'Tu solicitud ha sido enviada. Te contactaremos pronto.', id: request.id };
  }
}
