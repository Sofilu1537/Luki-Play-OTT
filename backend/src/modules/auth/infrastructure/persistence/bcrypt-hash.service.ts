import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashService } from '../../domain/interfaces/hash.service';

/**
 * Bcrypt-based implementation of the {@link HashService} port.
 *
 * Uses 12 salt rounds for password hashing. Both `hash` and `compare`
 * are CPU-bound operations delegated to the bcrypt native binding.
 */
@Injectable()
export class BcryptHashService implements HashService {
  private readonly saltRounds = 12;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}