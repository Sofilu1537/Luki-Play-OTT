/** Target audience of a JWT — determines which endpoints the token can access. */
export enum Audience {
  APP = 'app',
  CMS = 'cms',
}

/**
 * Domain entity representing an authenticated session.
 *
 * Each successful login creates a Session bound to a specific device
 * and audience. The refresh token hash is stored for rotation and
 * reuse detection.
 */
export class Session {
  readonly id: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly audience: Audience;
  refreshTokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  revokedAt: Date | null;

  constructor(props: {
    id: string;
    userId: string;
    deviceId: string;
    audience: Audience;
    refreshTokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date | null;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.deviceId = props.deviceId;
    this.audience = props.audience;
    this.refreshTokenHash = props.refreshTokenHash;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.revokedAt = props.revokedAt ?? null;
  }

  /** Whether the session has passed its expiration date. */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /** Whether the session has been explicitly revoked. */
  isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}
