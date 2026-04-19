import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { AccountRepository } from '../../auth/domain/interfaces/account.repository.js';
import {
  Account,
  ContractType,
  SubscriptionStatus,
  ServiceStatus,
  SessionLimitPolicy,
} from '../../auth/domain/entities/account.entity.js';

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Account | null> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { customer: true },
    });
    return contract ? this.toDomain(contract) : null;
  }

  async findByContractNumber(contractNumber: string): Promise<Account | null> {
    const contract = await this.prisma.contract.findUnique({
      where: { contractNumber },
      include: { customer: true },
    });
    return contract ? this.toDomain(contract) : null;
  }

  async save(account: Account): Promise<Account> {
    const data = {
      planName: 'LUKI PLAY',
      maxDevices: account.maxDevices,
      sessionDurationDays: account.sessionDurationDays,
      sessionLimitPolicy:
        account.sessionLimitPolicy === SessionLimitPolicy.REPLACE_OLDEST
          ? ('REPLACE_OLDEST' as const)
          : ('BLOCK_NEW' as const),
    };

    const contract = await this.prisma.contract.update({
      where: { id: account.id },
      data,
      include: { customer: true },
    });

    return this.toDomain(contract);
  }

  // ─── Mapping helpers ──────────────────────────────────────

  private toDomain(contract: any): Account {
    return new Account({
      id: contract.id,
      contractNumber: contract.contractNumber,
      contractType: ContractType.ISP,
      isIspCustomer: true,
      planId: 'plan-lukiplay',
      subscriptionStatus: this.mapSubscriptionStatus(contract),
      serviceStatus: this.mapServiceStatus(contract),
      maxDevices: contract.maxDevices,
      sessionDurationDays: contract.sessionDurationDays,
      sessionLimitPolicy:
        contract.sessionLimitPolicy === 'REPLACE_OLDEST'
          ? SessionLimitPolicy.REPLACE_OLDEST
          : SessionLimitPolicy.BLOCK_NEW,
    });
  }

  private mapSubscriptionStatus(contract: any): SubscriptionStatus {
    const customerStatus: string = contract.customer?.status;
    switch (customerStatus) {
      case 'ACTIVE':
        return SubscriptionStatus.ACTIVE;
      case 'SUSPENDED':
        return SubscriptionStatus.SUSPENDED;
      default:
        return SubscriptionStatus.CANCELLED;
    }
  }

  private mapServiceStatus(contract: any): ServiceStatus | null {
    const customerStatus: string = contract.customer?.status;
    switch (customerStatus) {
      case 'ACTIVE':
        return ServiceStatus.ACTIVO;
      case 'SUSPENDED':
        return ServiceStatus.SUSPENDIDO;
      case 'INACTIVE':
        return ServiceStatus.ANULADO;
      default:
        return null;
    }
  }
}
