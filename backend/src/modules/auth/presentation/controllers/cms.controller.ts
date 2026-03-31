import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user.entity';
import { GetCmsStatsUseCase, CmsStatsResponse } from '../../application/use-cases/get-cms-stats.use-case';
import { ListActiveSessionsUseCase } from '../../application/use-cases/list-active-sessions.use-case';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case';
import { SessionResponse, MessageResponse } from '../../application/dto/auth-response.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../../domain/interfaces/token.service';
import { Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { ACCOUNT_REPOSITORY } from '../../domain/interfaces/account.repository';
import type { AccountRepository } from '../../domain/interfaces/account.repository';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';

@ApiTags('CMS')
@Controller('cms')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CmsController {
  constructor(
    private readonly getCmsStatsUseCase: GetCmsStatsUseCase,
    private readonly listActiveSessionsUseCase: ListActiveSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  @Get('stats')
  @Roles(UserRole.SUPERADMIN, UserRole.SOPORTE)
  @ApiOperation({ summary: 'Get CMS dashboard statistics' })
  async getStats(): Promise<CmsStatsResponse> {
    return this.getCmsStatsUseCase.execute();
  }

  @Get('users')
  @Roles(UserRole.SUPERADMIN, UserRole.SOPORTE)
  @ApiOperation({ summary: 'List all users (admin only)' })
  async listUsers() {
    const users = await this.userRepo.findAll();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      contractNumber: u.contractNumber,
      role: u.role,
      status: u.status,
      accountId: u.accountId,
      phone: u.phone,
      createdAt: u.createdAt,
    }));
  }

  @Get('accounts')
  @Roles(UserRole.SUPERADMIN, UserRole.SOPORTE)
  @ApiOperation({ summary: 'List all accounts (admin only)' })
  async listAccounts() {
    const accounts = await this.accountRepo.findAll();
    return accounts.map((a) => ({
      id: a.id,
      contractNumber: a.contractNumber,
      contractType: a.contractType,
      isIspCustomer: a.isIspCustomer,
      planId: a.planId,
      subscriptionStatus: a.subscriptionStatus,
      serviceStatus: a.serviceStatus,
      maxDevices: a.maxDevices,
      canAccessOtt: a.canAccessOtt,
      restrictionMessage: a.restrictionMessage,
    }));
  }

  @Get('sessions')
  @Roles(UserRole.SUPERADMIN, UserRole.SOPORTE)
  @ApiOperation({ summary: 'List all active sessions (admin only)' })
  async listSessions(): Promise<SessionResponse[]> {
    const sessions = await this.sessionRepo.findAll();
    return sessions
      .filter((s) => !s.isRevoked() && !s.isExpired())
      .map((s) => ({
        id: s.id,
        deviceId: s.deviceId,
        audience: s.audience,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      }));
  }

  @Delete('sessions/:id')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke any session (superadmin only)' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') sessionId: string,
  ): Promise<MessageResponse> {
    const session = await this.sessionRepo.findById(sessionId);
    if (session) {
      await this.revokeSessionUseCase.execute(session.userId, sessionId);
    }
    return { message: 'Session revoked successfully' };
  }
}
