import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/interfaces/user.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InMemoryUserRepository implements UserRepository, OnModuleInit {
  private readonly logger = new Logger(InMemoryUserRepository.name);
  private users: Map<string, User> = new Map();

  async onModuleInit(): Promise<void> {
    this.logger.log('Seeding in-memory user repository...');
    const hash = await bcrypt.hash('password123', 12);

    const seedUsers: User[] = [
      new User({ id: 'usr-001', contractNumber: 'CONTRACT-001', email: 'juan@example.com', phone: '+57300111222', passwordHash: hash, role: UserRole.CLIENTE, status: UserStatus.ACTIVE, accountId: 'acc-001', createdAt: new Date() }),
      new User({ id: 'usr-002', contractNumber: 'CONTRACT-002', email: 'maria@example.com', phone: '+57300333444', passwordHash: hash, role: UserRole.CLIENTE, status: UserStatus.ACTIVE, accountId: 'acc-002', createdAt: new Date() }),
      new User({ id: 'usr-003', contractNumber: 'CONTRACT-003', email: 'carlos@example.com', phone: '+57300555666', passwordHash: hash, role: UserRole.CLIENTE, status: UserStatus.ACTIVE, accountId: 'acc-003', createdAt: new Date() }),
      new User({ id: 'usr-004', contractNumber: 'CONTRACT-004', email: 'ana@example.com', phone: '+57300777888', passwordHash: hash, role: UserRole.CLIENTE, status: UserStatus.ACTIVE, accountId: 'acc-004', createdAt: new Date() }),
      new User({ id: 'usr-ott-001', contractNumber: 'OTT-000001', email: 'pedro@example.com', phone: '+57300999000', passwordHash: hash, role: UserRole.CLIENTE, status: UserStatus.ACTIVE, accountId: 'acc-ott-001', createdAt: new Date() }),
      new User({ id: 'usr-admin-001', contractNumber: null, email: 'admin@lukiplay.com', firstName: 'Admin', lastName: 'Principal', passwordHash: hash, role: UserRole.SUPERADMIN, status: UserStatus.ACTIVE, accountId: null, createdAt: new Date() }),
      new User({ id: 'usr-soporte-001', contractNumber: null, email: 'soporte@lukiplay.com', firstName: 'Agente', lastName: 'Soporte', passwordHash: hash, role: UserRole.SOPORTE, status: UserStatus.ACTIVE, accountId: null, createdAt: new Date() }),
    ];

    for (const user of seedUsers) {
      this.users.set(user.id, user);
    }
    this.logger.log(`Seeded ${seedUsers.length} users`);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByContractNumber(contractNumber: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.contractNumber === contractNumber) return user;
    }
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) return user;
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.mustChangePassword = false;
    }
  }
}
