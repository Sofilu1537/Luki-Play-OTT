import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EmailService } from '../../domain/interfaces/email.service';

@Injectable()
export class NodemailerEmailService implements EmailService {
  private readonly logger = new Logger(NodemailerEmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('SMTP_FROM', 'noreply@lukiplay.com');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 2525),
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordReset(to: string, resetLink: string, displayName: string): Promise<void> {
    await this.send(to, 'Recupera tu contraseña — Luki Play', `
      <h2>Hola ${displayName},</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Restablecer contraseña</a></p>
      <p>Este enlace es válido por 1 hora y solo puede usarse una vez.</p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `);
  }

  async sendFirstAccess(to: string, accessLink: string, displayName: string): Promise<void> {
    await this.send(to, 'Activa tu cuenta — Luki Play CMS', `
      <h2>Hola ${displayName},</h2>
      <p>Tu cuenta en Luki Play CMS ha sido creada.</p>
      <p><a href="${accessLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Activar cuenta</a></p>
      <p>Este enlace es válido por 24 horas. Un solo uso.</p>
    `);
  }

  async sendGeneratedPassword(to: string, password: string, displayName: string): Promise<void> {
    await this.send(to, 'Tu nueva contraseña — Luki Play', `
      <h2>Hola ${displayName},</h2>
      <p>Se ha generado una nueva contraseña temporal para tu cuenta:</p>
      <p style="font-size:20px;font-weight:bold;background:#1e1b4b;color:#a5b4fc;padding:16px;border-radius:8px;text-align:center;letter-spacing:2px;">${password}</p>
      <p>Por seguridad, cámbiala después de iniciar sesión.</p>
    `);
  }

  async sendRecoveryCode(to: string, code: string): Promise<void> {
    await this.send(to, 'Código de recuperación — Luki Play', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#6366f1;">Luki Play</h2>
        <p>Tu código de recuperación de contraseña es:</p>
        <p style="font-size:28px;font-weight:bold;background:#1e1b4b;color:#a5b4fc;padding:20px;border-radius:8px;text-align:center;letter-spacing:4px;">${code}</p>
        <p style="color:#666;font-size:13px;">Este código expira en 15 minutos. Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `);
  }

  async sendActivationCode(to: string, code: string): Promise<void> {
    await this.send(to, 'Activa tu cuenta — Luki Play', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#6366f1;">Bienvenido a Luki Play</h2>
        <p>Se ha creado una cuenta para ti en el CMS de Luki Play.</p>
        <p>Tu código de activación es:</p>
        <p style="font-size:28px;font-weight:bold;background:#1e1b4b;color:#a5b4fc;padding:20px;border-radius:8px;text-align:center;letter-spacing:4px;">${code}</p>
        <p style="color:#666;font-size:13px;">Este código es válido por 24 horas y solo puede usarse una vez.</p>
        <p style="color:#666;font-size:13px;">Al activar tu cuenta deberás establecer tu contraseña personal.</p>
      </div>
    `);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to} — messageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, (error as Error).stack);
      throw error;
    }
  }
}
