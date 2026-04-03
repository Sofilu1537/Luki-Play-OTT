export class LoginAttempt {
  readonly id: string;
  readonly email: string;
  readonly ipAddress: string | null;
  readonly succeeded: boolean;
  readonly failureReason: string | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    email: string;
    ipAddress?: string | null;
    succeeded: boolean;
    failureReason?: string | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.ipAddress = props.ipAddress ?? null;
    this.succeeded = props.succeeded;
    this.failureReason = props.failureReason ?? null;
    this.createdAt = props.createdAt;
  }
}
