/** Roles available in the platform. */
export enum UserRole {
  SUPERADMIN = 'superadmin',
  SOPORTE = 'soporte',
  CLIENTE = 'cliente',
}

/** Lifecycle status of a user account. */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Domain entity representing a platform user.
 *
 * A user may be:
 * - An ISP subscriber (CLIENTE) tied to a billing {@link Account}
 * - A CMS operator (SUPERADMIN or SOPORTE) with no billing account
 */
export class User {
  readonly id: string;
  readonly contractNumber: string | null;
  readonly email: string;
  readonly phone: string | null;
  passwordHash: string;
  readonly role: UserRole;
  status: UserStatus;
  readonly accountId: string | null;
  readonly createdAt: Date;

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
  }

  /** Whether the user’s status allows login. */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /** Whether this user is a subscriber (CLIENTE role). */
  isClient(): boolean {
    return this.role === UserRole.CLIENTE;
  }

  /** Whether this user can access the CMS panel (SUPERADMIN or SOPORTE). */
  isCmsUser(): boolean {
    return this.role === UserRole.SUPERADMIN || this.role === UserRole.SOPORTE;
  }
}