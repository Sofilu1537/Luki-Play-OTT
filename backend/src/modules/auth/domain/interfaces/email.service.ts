export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

export interface EmailService {
  sendPasswordReset(to: string, resetLink: string, displayName: string): Promise<void>;
  sendFirstAccess(to: string, accessLink: string, displayName: string): Promise<void>;
  sendGeneratedPassword(to: string, password: string, displayName: string): Promise<void>;
  sendRecoveryCode(to: string, code: string): Promise<void>;
  sendActivationCode(to: string, code: string): Promise<void>;
}
