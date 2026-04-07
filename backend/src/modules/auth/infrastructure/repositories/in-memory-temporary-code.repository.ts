import { Injectable } from '@nestjs/common';
import { TemporaryCode, TemporaryCodeType } from '../../domain/entities/temporary-code.entity';
import { TemporaryCodeRepository } from '../../domain/interfaces/temporary-code.repository';

@Injectable()
export class InMemoryTemporaryCodeRepository implements TemporaryCodeRepository {
  private codes: Map<string, TemporaryCode> = new Map();

  async save(code: TemporaryCode): Promise<void> {
    this.codes.set(code.id, code);
  }

  async findByEmailAndType(email: string, type: TemporaryCodeType): Promise<TemporaryCode[]> {
    const normalized = email.trim().toLowerCase();
    return Array.from(this.codes.values()).filter(
      (c) => c.email.toLowerCase() === normalized && c.type === type,
    );
  }

  async markUsed(id: string): Promise<void> {
    const code = this.codes.get(id);
    if (code) code.usedAt = new Date();
  }

  async invalidateByEmailAndType(email: string, type: TemporaryCodeType): Promise<void> {
    const normalized = email.trim().toLowerCase();
    for (const code of this.codes.values()) {
      if (code.email.toLowerCase() === normalized && code.type === type && !code.usedAt) {
        code.usedAt = new Date();
      }
    }
  }
}
