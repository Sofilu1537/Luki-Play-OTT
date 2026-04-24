import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { UserRepository } from '../../auth/domain/interfaces/user.repository.js';
import {
  User,
  UserRole,
  UserStatus,
} from '../../auth/domain/entities/user.entity.js';
import {
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
} from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { contracts: true },
    });
    return customer ? this.toDomain(customer) : null;
  }

  async findByContractNumber(contractNumber: string): Promise<User | null> {
    const contract = await this.prisma.contract.findUnique({
      where: { contractNumber },
      include: { customer: { include: { contracts: true } } },
    });
    return contract?.customer ? this.toDomain(contract.customer) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: { contracts: true },
    });
    return customer ? this.toDomain(customer) : null;
  }

  async findAll(): Promise<User[]> {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: { contracts: true },
    });
    return customers.map((c) => this.toDomain(c));
  }

  async save(user: User): Promise<User> {
    const data = {
      nombre:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      idNumber: user.idNumber,
      email: user.email || null,
      telefono: user.phone,
      passwordHash: user.passwordHash,
      role: this.toPrismaRole(user.role),
      status: this.toPrismaStatus(user.status),
      mustChangePassword: user.mustChangePassword,
      mfaEnabled: user.mfaEnabled,
      lockedUntil: user.lockedUntil,
      lastLoginAt: user.lastLoginAt,
      isCmsUser: user.isCmsUser(),
    };

    const customer = await this.prisma.customer.upsert({
      where: { id: user.id },
      update: data,
      create: { id: user.id, ...data },
      include: { contracts: true },
    });

    return this.toDomain(customer);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  // ─── Mapping helpers ──────────────────────────────────────

  private toDomain(customer: any): User {
    const contract = customer.contracts?.[0];
    return new User({
      id: customer.id,
      contractNumber: contract?.contractNumber ?? null,
      email: customer.email ?? customer.ispEmail ?? '',
      phone: customer.telefono,
      passwordHash: customer.passwordHash ?? '',
      role: this.toDomainRole(customer.role),
      status: this.toDomainStatus(customer.status),
      accountId: contract?.id ?? null,
      createdAt: customer.createdAt,
      firstName: customer.firstName,
      lastName: customer.lastName,
      idNumber: customer.idNumber,
      mustChangePassword: customer.mustChangePassword,
      mfaEnabled: customer.mfaEnabled,
      lockedUntil: customer.lockedUntil,
      failedAttempts: 0,
      lastLoginAt: customer.lastLoginAt,
      createdBy: null,
      dynamicPermissions: customer.permissions ?? [],
    });
  }

  private toDomainRole(prismaRole: PrismaUserRole): UserRole {
    switch (prismaRole) {
      case 'SUPERADMIN':
        return UserRole.SUPERADMIN;
      case 'ADMIN':
        return UserRole.ADMIN;
      case 'SOPORTE':
        return UserRole.SOPORTE;
      case 'CLIENTE':
      default:
        return UserRole.CLIENTE;
    }
  }

  private toDomainStatus(prismaStatus: PrismaUserStatus): UserStatus {
    switch (prismaStatus) {
      case 'ACTIVE':
        return UserStatus.ACTIVE;
      case 'SUSPENDED':
        return UserStatus.SUSPENDED;
      case 'INACTIVE':
        return UserStatus.INACTIVE;
      case 'PENDING':
      case 'TRIAL':
      default:
        return UserStatus.INACTIVE;
    }
  }

  private toPrismaRole(role: UserRole): PrismaUserRole {
    switch (role) {
      case UserRole.SUPERADMIN:
        return 'SUPERADMIN';
      case UserRole.ADMIN:
        return 'ADMIN';
      case UserRole.SOPORTE:
        return 'SOPORTE';
      case UserRole.CLIENTE:
      default:
        return 'CLIENTE';
    }
  }

  private toPrismaStatus(status: UserStatus): PrismaUserStatus {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'ACTIVE';
      case UserStatus.SUSPENDED:
        return 'SUSPENDED';
      case UserStatus.INACTIVE:
      default:
        return 'INACTIVE';
    }
  }
}
