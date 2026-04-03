import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Port for user persistence operations.
 *
 * Implementations: {@link InMemoryUserRepository} (dev), future TypeORM repo (prod).
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByContractNumber(contractNumber: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}