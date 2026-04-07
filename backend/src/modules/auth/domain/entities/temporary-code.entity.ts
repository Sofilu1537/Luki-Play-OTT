import { createHash } from 'crypto';

export enum TemporaryCodeType {
  ACTIVATION = 'ACTIVATION',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export class TemporaryCode {
  readonly id: string;
  readonly userId: string;
  readonly email: string;
  readonly type: TemporaryCodeType;
  readonly codeHash: string;
  readonly expiresAt: Date;
  usedAt: Date | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    userId: string;
    email: string;
    type: TemporaryCodeType;
    codeHash: string;
    expiresAt: Date;
    usedAt?: Date | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.email = props.email;
    this.type = props.type;
    this.codeHash = props.codeHash;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt ?? null;
    this.createdAt = props.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  matchesCode(rawCode: string): boolean {
    const hash = createHash('sha256').update(rawCode).digest('hex');
    return hash === this.codeHash;
  }
}
