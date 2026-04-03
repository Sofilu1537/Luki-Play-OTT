export class AuditLog {
  readonly id: string;
  readonly actorId: string | null;
  readonly action: string;
  readonly targetId: string | null;
  readonly targetType: string | null;
  readonly metadata: Record<string, unknown>;
  readonly ipAddress: string | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    actorId?: string | null;
    action: string;
    targetId?: string | null;
    targetType?: string | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.actorId = props.actorId ?? null;
    this.action = props.action;
    this.targetId = props.targetId ?? null;
    this.targetType = props.targetType ?? null;
    this.metadata = props.metadata ?? {};
    this.ipAddress = props.ipAddress ?? null;
    this.createdAt = props.createdAt;
  }
}
