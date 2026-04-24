export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

export interface RegistrationRequestData {
  nombres: string;
  apellidos: string;
  idNumber: string;
  telefono: string;
  email?: string;
  direccion?: string;
  requestId: string;
}

export interface EmailService {
  sendPasswordReset(
    to: string,
    resetLink: string,
    displayName: string,
  ): Promise<void>;
  sendFirstAccess(
    to: string,
    accessLink: string,
    displayName: string,
  ): Promise<void>;
  sendGeneratedPassword(
    to: string,
    password: string,
    displayName: string,
  ): Promise<void>;
  sendRecoveryCode(to: string, code: string, name?: string): Promise<void>;
  sendActivationCode(to: string, code: string): Promise<void>;
  sendRegistrationRequest(data: RegistrationRequestData): Promise<void>;

  // ─── Subscription lifecycle notifications ─────────────────────────────────
  sendSubscriptionReminder(
    to: string,
    displayName: string,
    expirationDate: Date,
  ): Promise<void>;
  sendSubscriptionExpired(
    to: string,
    displayName: string,
    graceDeadline: Date,
  ): Promise<void>;
  sendSubscriptionSuspended(to: string, displayName: string): Promise<void>;
}

