import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  EmailService,
  EmailHealthResult,
  RegistrationRequestData,
} from '../../domain/interfaces/email.service';

@Injectable()
export class NodemailerEmailService implements EmailService {
  private readonly logger = new Logger(NodemailerEmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('SMTP_FROM', 'noreply@luki.ec');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 2525),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendPasswordReset(
    to: string,
    resetLink: string,
    displayName: string,
  ): Promise<void> {
    await this.send(
      to,
      'Recupera tu contraseña — Luki Play',
      `
      <h2>Hola ${displayName},</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Restablecer contraseña</a></p>
      <p>Este enlace es válido por 1 hora y solo puede usarse una vez.</p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `,
    );
  }

  async sendFirstAccess(
    to: string,
    accessLink: string,
    displayName: string,
  ): Promise<void> {
    const content = `
      <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #6366f1; margin: 25px 0;">
        <p style="margin-top: 0; font-size: 15px; color: #444;">Tu cuenta ha sido creada exitosamente. Para empezar a usar la plataforma, necesitas activar tu cuenta haciendo clic en el siguiente enlace:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${accessLink}" style="display: inline-block; padding: 14px 28px; background-color: #ffb700; color: #291754; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Activar mi cuenta</a>
        </div>
        <p style="font-size: 13px; color: #666; margin-bottom: 0;">Este enlace de activación es válido por 24 horas y es de un solo uso.</p>
      </div>
    `;
    await this.send(
      to,
      'Activa tu cuenta — luki net',
      this.buildLukiEmail(displayName, content),
    );
  }

  async sendGeneratedPassword(
    to: string,
    password: string,
    displayName: string,
  ): Promise<void> {
    const content = `
      <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #6366f1; margin: 25px 0;">
        <p style="margin-top: 0; font-size: 15px; color: #444;">Se ha generado una contraseña temporal para tu cuenta:</p>
        <p style="font-size: 24px; font-weight: bold; background: #eaedf4; color: #311456; padding: 15px; border-radius: 6px; text-align: center; letter-spacing: 2px;">${password}</p>
        <p style="font-size: 13px; color: #666; margin-bottom: 0;">Por seguridad, te pediremos que la cambies después de iniciar sesión la próxima vez.</p>
      </div>
    `;
    await this.send(
      to,
      'Clave temporal — luki net',
      this.buildLukiEmail(displayName, content),
    );
  }

  async sendRecoveryCode(
    to: string,
    code: string,
    name?: string,
  ): Promise<void> {
    const greetingName = name || 'Usuario';

    // Logo block for the header
    const logoHtml = `
      <div style="text-align: center; display: inline-block;">
        <div style="font-family: Arial, Helvetica, sans-serif; font-weight: 900; font-size: 38px; color: #ffffff; line-height: 1;">luki</div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-size: 22px; background-color: #ffb800; color: #ffffff; padding: 2px 14px; border-radius: 8px; margin-top: 4px; display: inline-block; line-height: 1.2;">play</div>
      </div>
    `;

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f2f2f2; padding: 20px; color: #333333;">
        <div style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #4f0fc4 0%, #240046 100%); padding: 35px 30px;">
            <tr>
              <td style="color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1.3;">
                Recuperación<br />
                de Acceso<br />
                Luki Play
              </td>
              <td align="right" valign="middle">
                ${logoHtml}
              </td>
            </tr>
          </table>

          <!-- Body Content -->
          <div style="padding: 40px 30px; text-align: center;">
            <p style="margin-top: 0; font-size: 22px; color: #222222;">¡Hola, ${greetingName}!</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #111111; margin: 25px 0 35px 0;">
              Has solicitado recuperar el acceso a tu cuenta. Aquí tienes tu contraseña temporal para volver a disfrutar del entretenimiento.
            </p>
            
            <!-- Code Block (Yellow Pill) -->
            <div style="margin: 0 auto; display: inline-block; background: linear-gradient(180deg, #ffcd00 0%, #ffaa00 100%); padding: 16px 45px; border-radius: 12px;">
              <span style="font-size: 34px; font-weight: 900; color: #111111; letter-spacing: 5px;">${code}</span>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #000000; margin-top: 40px; margin-bottom: 0;">
              Por seguridad, cámbiala en tu perfil después de iniciar sesión.<br />
              Este código expira en 15 minutos.
            </p>
          </div>
          
          <!-- Dark Purple Footer -->
          <div style="background-color: #1a0033; padding: 30px 20px; text-align: center;">
            <p style="font-size: 16px; color: #f2f2f2; margin: 0; font-weight: normal;">
              ¡El entretenimiento como siempre debió ser!
            </p>
          </div>
          
        </div>
        
        <!-- Bottom Legal Elements -->
        <div style="text-align: center; color: #666666; font-size: 13px; margin-top: 20px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Luki Play. Todos los derechos reservados.</p>
          <p style="margin: 4px 0 0 0;">Si no solicitaste esto, ignora el mensaje.</p>
        </div>
      </div>
    `;

    await this.send(to, 'Recuperación de Acceso — Luki Play', html);
  }

  private buildLukiEmail(
    name: string,
    content: string,
    isWelcome: boolean = false,
  ): string {
    const greetingName = name || 'Usuario';
    const welcomeText = isWelcome
      ? '<span style="font-family: Georgia, serif; font-size: 32px; padding: 0;">Bienvenido a</span>'
      : '<span style="font-family: Georgia, serif; font-size: 28px; padding: 0;">Notificación de</span>';

    const welcomeParagraph = isWelcome
      ? `<p style="font-size: 16px; margin-bottom: 30px;">Es un gusto tenerte con nosotros. Desde hoy, todo nuestro equipo está comprometido en brindarte el mejor servicio, porque para nosotros <strong>tú eres el centro de nuestra operación</strong>.</p>`
      : '';

    const logoHtml = `
      <span style="font-family: Arial, Helvetica, sans-serif; font-weight: 900; font-size: 34px; color: #ffffff; vertical-align: middle; margin-left: 10px;">luki</span>
      <span style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-size: 24px; background-color: #ffb800; color: #240046; padding: 4px 10px; border-radius: 6px; vertical-align: middle; margin-left: 4px;">play</span>
    `;

    const footerLogoHtml = `
      <span style="font-family: Arial, Helvetica, sans-serif; font-weight: 900; font-size: 28px; color: #ffffff; vertical-align: middle;">luki</span>
      <span style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-size: 18px; background-color: #ffb800; color: #240046; padding: 3px 8px; border-radius: 6px; vertical-align: middle; margin-left: 4px;">play</span>
    `;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #333333; line-height: 1.6; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #240046; color: #ffffff; padding: 25px 20px;">
          <tr>
            <td style="font-family: Georgia, serif; font-size: 32px; padding: 0;">
              ${welcomeText}
              ${logoHtml}
            </td>
          </tr>
        </table>
        
        <!-- Body Content -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="margin-top: 0; font-size: 16px;">Hola, <strong>${greetingName}</strong>,</p>
          
          ${welcomeParagraph}
          ${content}
          
        </div>
        
        <!-- Rich Footer (Luki Play Design) -->
        <div style="background-color: #240046; padding: 40px 40px; text-align: center; color: #ffffff;">
          <h2 style="color: #ffb800; font-family: Georgia, serif; font-size: 24px; font-weight: normal; margin: 0 0 20px 0;">Gracias por confiar en nosotros.</h2>
          <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0; color: #ffffff;">
            En Luki Play trabajamos con entusiasmo y compromiso para darte una experiencia diferente: <strong>clara, estable y sin complicaciones</strong>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ffb800; width: 100%; margin: 0 0 30px 0;" />
          
          <div style="margin-bottom: 15px;">
            ${footerLogoHtml}
          </div>
          <p style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; margin: 0; color: #ffffff;">¡el entretenimiento como siempre debió ser!</p>
        </div>
        
        <!-- Legal Footer -->
        <div style="background-color: #1a0033; padding: 15px 20px; text-align: center; color: #a3a3a3; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Luki Play. Todos los derechos reservados.</p>
          <p style="margin: 5px 0 0 0;">Este correo es de carácter informativo. Por favor no respondas a este mensaje.</p>
        </div>
        
      </div>
    `;
  }

  async sendActivationCode(to: string, code: string): Promise<void> {
    const greetingName = to.split('@')[0];
    const content = `
      <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #f7b600; margin: 25px 0;">
        <p style="margin-top: 0; font-size: 15px; color: #444;">Tu código de activación es:</p>
        <p style="font-size: 28px; font-weight: bold; background: #fffadc; color: #2b1d52; padding: 20px; border-radius: 8px; text-align: center; letter-spacing: 4px;">${code}</p>
        <p style="font-size: 13px; color: #666; margin-bottom: 0;">Este código de activación es válido por 24 horas y solo puede usarse una vez.<br/>Al activarlo, se te pedirá establecer tu contraseña personal.</p>
      </div>
    `;
    await this.send(
      to,
      'Código de activación — luki net',
      this.buildLukiEmail(greetingName, content, true),
    );
  }

  async sendRegistrationRequest(data: RegistrationRequestData): Promise<void> {
    const INTERNAL = 'noreply@luki.ec';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #333; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4f0fc4 0%, #240046 100%); padding: 28px 30px;">
          <span style="font-weight: 900; font-size: 32px; color: #fff;">luki</span>
          <span style="font-weight: bold; font-size: 22px; background: #ffb800; color: #240046; padding: 3px 10px; border-radius: 6px; margin-left: 4px;">play</span>
          <p style="color: #e0d0ff; margin: 12px 0 0; font-size: 18px; font-weight: 600;">Nueva solicitud de alta</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 8px; color: #666; width: 140px;">Nombres</td>
              <td style="padding: 10px 8px; font-weight: 600;">${data.nombres} ${data.apellidos}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 8px; color: #666;">Cédula</td>
              <td style="padding: 10px 8px; font-weight: 600;">${data.idNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 8px; color: #666;">Teléfono</td>
              <td style="padding: 10px 8px;">${data.telefono}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 8px; color: #666;">Correo</td>
              <td style="padding: 10px 8px;">${data.email ?? '—'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 8px; color: #666;">Dirección</td>
              <td style="padding: 10px 8px;">${data.direccion ?? '—'}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 13px; color: #888;">ID solicitud: <code>${data.requestId}</code></p>
        </div>
        <div style="background: #1a0033; padding: 16px 20px; text-align: center; color: #a3a3a3; font-size: 12px;">
          © ${new Date().getFullYear()} Luki Play — Gestión interna
        </div>
      </div>
    `;
    await this.send(
      INTERNAL,
      `Nueva solicitud de alta — ${data.nombres} ${data.apellidos}`,
      html,
    );
  }

  // ─── Subscription lifecycle notifications ─────────────────────────────────

  async sendSubscriptionReminder(
    to: string,
    displayName: string,
    expirationDate: Date,
  ): Promise<void> {
    const formatted = expirationDate.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const content = `
      <div style="background-color: #fff8e1; padding: 20px; border-left: 4px solid #ffb700; margin: 25px 0; border-radius: 4px;">
        <p style="margin-top: 0; font-size: 15px; color: #444;">Tu suscripción a <strong>Luki Play</strong> vence el <strong>${formatted}</strong>.</p>
        <p style="font-size: 14px; color: #666; margin-bottom: 0;">Para continuar disfrutando sin interrupciones, renueva antes de esa fecha.</p>
      </div>
    `;
    await this.send(
      to,
      'Tu suscripción vence pronto — Luki Play',
      this.buildLukiEmail(displayName, content),
    );
  }

  async sendSubscriptionExpired(
    to: string,
    displayName: string,
    graceDeadline: Date,
  ): Promise<void> {
    const formatted = graceDeadline.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const content = `
      <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin: 25px 0; border-radius: 4px;">
        <p style="margin-top: 0; font-size: 15px; color: #444;">Tu suscripción a <strong>Luki Play</strong> ha vencido.</p>
        <p style="font-size: 14px; color: #666;">Tienes hasta el <strong>${formatted}</strong> para renovar y mantener el acceso.</p>
        <p style="font-size: 14px; color: #666; margin-bottom: 0;">Si no renuevas antes de esa fecha, tu cuenta será suspendida automáticamente.</p>
      </div>
    `;
    await this.send(
      to,
      'Tu suscripción ha vencido — Luki Play',
      this.buildLukiEmail(displayName, content),
    );
  }

  async sendSubscriptionSuspended(
    to: string,
    displayName: string,
  ): Promise<void> {
    const content = `
      <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 25px 0; border-radius: 4px;">
        <p style="margin-top: 0; font-size: 15px; color: #444;">Tu acceso a <strong>Luki Play</strong> ha sido suspendido por falta de renovación.</p>
        <p style="font-size: 14px; color: #666; margin-bottom: 0;">Contacta a soporte o renueva tu plan para reactivar tu cuenta.</p>
      </div>
    `;
    await this.send(
      to,
      'Tu cuenta ha sido suspendida — Luki Play',
      this.buildLukiEmail(displayName, content),
    );
  }

  async checkConnection(sendTestTo?: string): Promise<EmailHealthResult> {
    const host = this.config.get<string>('SMTP_HOST', '');
    const port = this.config.get<number>('SMTP_PORT', 0);
    const t0 = Date.now();
    try {
      await this.transporter.verify();
    } catch (error) {
      return {
        ok: false,
        detail: `SMTP auth failed: ${(error as Error).message}`,
        host,
        port,
        durationMs: Date.now() - t0,
      };
    }

    if (!sendTestTo) {
      return { ok: true, detail: 'SMTP connection verified', host, port, durationMs: Date.now() - t0 };
    }

    // Optional: send a real test email to validate full delivery path
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: sendTestTo,
        subject: '[TEST] Servidor SMTP operativo — Luki Play',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
            <h2 style="color:#240046;margin-top:0;">✅ Servidor de correo operativo</h2>
            <p>Este correo confirma que el servidor SMTP de producción está funcionando correctamente.</p>
            <table style="width:100%;font-size:13px;border-collapse:collapse;margin-top:12px;">
              <tr><td style="padding:5px 8px;color:#888;">Host</td><td style="padding:5px 8px;font-weight:700;">${host}:${port}</td></tr>
              <tr><td style="padding:5px 8px;color:#888;">Fecha</td><td style="padding:5px 8px;font-weight:700;">${new Date().toLocaleString('es-EC')}</td></tr>
            </table>
            <p style="font-size:11px;color:#aaa;margin-top:16px;">Diagnóstico automático — no responder.</p>
          </div>`,
      });
      return {
        ok: true,
        detail: 'Test email sent successfully',
        host,
        port,
        sentTo: sendTestTo,
        messageId: info.messageId,
        durationMs: Date.now() - t0,
      };
    } catch (error) {
      return {
        ok: false,
        detail: `SMTP verified but send failed: ${(error as Error).message}`,
        host,
        port,
        sentTo: sendTestTo,
        durationMs: Date.now() - t0,
      };
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} — messageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
