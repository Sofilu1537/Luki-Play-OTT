import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { ACCOUNT_REPOSITORY } from '../../domain/interfaces/account.repository';
import type { AccountRepository } from '../../domain/interfaces/account.repository';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { UserRole } from '../../domain/entities/user.entity';
import { ContractType } from '../../domain/entities/account.entity';

export interface CmsStatsResponse {
  totalUsers: number;
  totalClients: number;
  totalCmsUsers: number;
  totalAccounts: number;
  totalIspAccounts: number;
  totalOttAccounts: number;
  totalActiveSessions: number;
}

@Injectable()
export class GetCmsStatsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(): Promise<CmsStatsResponse> {
    const [users, accounts, sessions] = await Promise.all([
      this.userRepo.findAll(),
      this.accountRepo.findAll(),
      this.sessionRepo.findAll(),
    ]);

    const activeSessions = sessions.filter(
      (s) => !s.isRevoked() && !s.isExpired(),
    );

    return {
      totalUsers: users.length,
      totalClients: users.filter((u) => u.role === UserRole.CLIENTE).length,
      totalCmsUsers: users.filter(
        (u) =>
          u.role === UserRole.SUPERADMIN || u.role === UserRole.SOPORTE,
      ).length,
      totalAccounts: accounts.length,
      totalIspAccounts: accounts.filter(
        (a) => a.contractType === ContractType.ISP,
      ).length,
      totalOttAccounts: accounts.filter(
        (a) => a.contractType === ContractType.OTT_ONLY,
      ).length,
      totalActiveSessions: activeSessions.length,
    };
  }
}
