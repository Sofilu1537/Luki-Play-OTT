import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../domain/interfaces/email.service';

@Injectable()
export class MockEmailService implements EmailService {
  private readonly logger = new Logger(MockEmailService.name);

  async sendPasswordReset(to: string, resetLink: string, displayName: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Password reset to ${to}`);
    this.logger.log(`[MOCK EMAIL] Hola ${displayName}, tu enlace de recuperación:`);
    this.logger.log(`[MOCK EMAIL] ${resetLink}`);
    this.logger.log(`[MOCK EMAIL] Válido por 1 hora. Un solo uso.`);
  }

  async sendFirstAccess(to: string, accessLink: string, displayName: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] First access invitation to ${to}`);
    this.logger.log(`[MOCK EMAIL] Hola ${displayName}, tu cuenta en Luki Play CMS fue creada.`);
    this.logger.log(`[MOCK EMAIL] Activa tu cuenta: ${accessLink}`);
    this.logger.log(`[MOCK EMAIL] Válido por 24 horas. Un solo uso.`);
  }

  async sendGeneratedPassword(to: string, password: string, displayName: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Generated password sent to ${to}`);
    this.logger.log(`[MOCK EMAIL] Hola ${displayName}, tu nueva contraseña temporal para Luki Play es:`);
    this.logger.log(`[MOCK EMAIL] Contraseña: ${password}`);
    this.logger.log(`[MOCK EMAIL] Por seguridad, cámbiala después de iniciar sesión.`);
  }

  async sendRecoveryCode(to: string, code: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Recovery code sent to ${to}`);
    this.logger.log(`[MOCK EMAIL] Tu código de recuperación es: ${code}`);
  }
}
