import { Injectable } from '@nestjs/common';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogRepository } from '../../domain/interfaces/audit-log.repository';

@Injectable()
export class InMemoryAuditLogRepository implements AuditLogRepository {
  private logs: AuditLog[] = [];

  async save(log: AuditLog): Promise<void> {
    this.logs.unshift(log); // newest first
    if (this.logs.length > 5000) this.logs.pop();
  }

  async findAll(limit = 100): Promise<AuditLog[]> {
    return this.logs.slice(0, limit);
  }

  async findByActorId(actorId: string): Promise<AuditLog[]> {
    return this.logs.filter((l) => l.actorId === actorId);
  }
}
