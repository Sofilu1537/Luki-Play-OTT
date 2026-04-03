export enum UserRole {
  SUPERADMIN = 'superadmin',
  SOPORTE = 'soporte',
  CLIENTE = 'cliente',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class User {
  readonly id: string;
  readonly contractNumber: string | null;
  readonly email: string;
  readonly phone: string | null;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  readonly accountId: string | null;
  readonly createdAt: Date;

  // Extended security fields
  firstName: string | null;
  lastName: string | null;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  lockedUntil: Date | null;
  failedAttempts: number;
  lastLoginAt: Date | null;
  readonly createdBy: string | null;

  constructor(props: {
    id: string;
    contractNumber: string | null;
    email: string;
    phone?: string | null;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    accountId: string | null;
    createdAt: Date;
    firstName?: string | null;
    lastName?: string | null;
    mustChangePassword?: boolean;
    mfaEnabled?: boolean;
    lockedUntil?: Date | null;
    failedAttempts?: number;
    lastLoginAt?: Date | null;
    createdBy?: string | null;
  }) {
    this.id = props.id;
    this.contractNumber = props.contractNumber;
    this.email = props.email;
    this.phone = props.phone ?? null;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.status = props.status;
    this.accountId = props.accountId;
    this.createdAt = props.createdAt;
    this.firstName = props.firstName ?? null;
    this.lastName = props.lastName ?? null;
    this.mustChangePassword = props.mustChangePassword ?? false;
    this.mfaEnabled = props.mfaEnabled ?? false;
    this.lockedUntil = props.lockedUntil ?? null;
    this.failedAttempts = props.failedAttempts ?? 0;
    this.lastLoginAt = props.lastLoginAt ?? null;
    this.createdBy = props.createdBy ?? null;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isClient(): boolean {
    return this.role === UserRole.CLIENTE;
  }

  isCmsUser(): boolean {
    return this.role === UserRole.SUPERADMIN || this.role === UserRole.SOPORTE;
  }

  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil > new Date();
  }

  lockMinutesRemaining(): number {
    if (!this.lockedUntil) return 0;
    return Math.ceil((this.lockedUntil.getTime() - Date.now()) / 60000);
  }

  displayName(): string {
    if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
    if (this.firstName) return this.firstName;
    return this.email.split('@')[0];
  }
}
