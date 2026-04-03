export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

export interface EmailService {
  sendPasswordReset(to: string, resetLink: string, displayName: string): Promise<void>;
  sendFirstAccess(to: string, accessLink: string, displayName: string): Promise<void>;
}
