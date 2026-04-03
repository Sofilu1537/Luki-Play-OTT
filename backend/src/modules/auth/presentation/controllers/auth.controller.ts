import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
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
import type { Request } from 'express';
import { LoginAppUseCase } from '../../application/use-cases/login-app.use-case';
import { CompleteLoginUseCase } from '../../application/use-cases/complete-login.use-case';
import { LoginCmsUseCase } from '../../application/use-cases/login-cms.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ListActiveSessionsUseCase } from '../../application/use-cases/list-active-sessions.use-case';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case';
import { RequestOtpUseCase } from '../../application/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from '../../application/use-cases/verify-otp.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { CompleteFirstAccessUseCase } from '../../application/use-cases/complete-first-access.use-case';
import { LoginAppDto } from '../../application/dto/login-app.dto';
import { LoginCmsDto } from '../../application/dto/login-cms.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../application/dto/reset-password.dto';
import { CompleteFirstAccessDto } from '../../application/dto/first-access.dto';
import {
  RequestOtpDto,
  VerifyOtpDto,
  VerifyLoginOtpDto,
} from '../../application/dto/otp.dto';
import {
  LoginChallengeResponse,
  AuthTokensResponse,
  UserProfileResponse,
  SessionResponse,
  MessageResponse,
} from '../../application/dto/auth-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../../domain/interfaces/token.service';

/**
 * REST controller for all authentication and session management operations.
 *
 * Endpoints are grouped under `/auth` and documented via Swagger.
 *
 * Public endpoints (no guard):
 * - `POST /auth/app/login` — Phase-1 login
 * - `POST /auth/app/verify-otp` — Phase-2 OTP verification
 * - `POST /auth/cms/login` — CMS single-step login
 * - `POST /auth/refresh` — Token rotation
 * - `POST /auth/otp/request` — Request/resend OTP
 * - `POST /auth/otp/verify` — Standalone OTP verification
 *
 * Protected endpoints (JwtAuthGuard):
 * - `POST /auth/logout`
 * - `GET  /auth/me`
 * - `POST /auth/change-password`
 * - `GET  /auth/sessions`
 * - `DELETE /auth/sessions/:id`
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginAppUseCase: LoginAppUseCase,
    private readonly completeLoginUseCase: CompleteLoginUseCase,
    private readonly loginCmsUseCase: LoginCmsUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly listActiveSessionsUseCase: ListActiveSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly requestOtpUseCase: RequestOtpUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly completeFirstAccessUseCase: CompleteFirstAccessUseCase,
  ) {}

  @Post('app/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phase 1: Validate credentials and send OTP' })
  @ApiResponse({ status: 200, type: LoginChallengeResponse })
  async loginApp(@Body() dto: LoginAppDto): Promise<LoginChallengeResponse> {
    return this.loginAppUseCase.execute(dto);
  }

  @Post('app/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phase 2: Verify OTP and complete login' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  async completeLogin(@Body() dto: VerifyLoginOtpDto): Promise<AuthTokensResponse> {
    return this.completeLoginUseCase.execute(dto);
  }

  @Post('cms/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'CMS login — email + password. Rate limited.' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta bloqueada' })
  async loginCms(@Body() dto: LoginCmsDto, @Req() req: Request): Promise<AuthTokensResponse> {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.loginCmsUseCase.execute(dto, ip);
  }

  @Post('cms/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password recovery email (anti-enumeration: always 200)' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponse> {
    await this.forgotPasswordUseCase.execute(dto.email);
    return { message: 'Si el correo está registrado, recibirás las instrucciones en breve.' };
  }

  @Post('cms/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using recovery token' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponse> {
    await this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }

  @Post('cms/first-access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete first access — set password and get session' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  async completeFirstAccess(@Body() dto: CompleteFirstAccessDto): Promise<AuthTokensResponse> {
    return this.completeFirstAccessUseCase.execute(
      dto.token,
      dto.newPassword,
      dto.deviceId ?? 'web',
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (rotation)' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke session' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async logout(@CurrentUser() user: JwtPayload, @Body() dto: RefreshTokenDto): Promise<MessageResponse> {
    await this.logoutUseCase.execute(user.sub, dto.refreshToken);
    return { message: 'Sesión cerrada exitosamente.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponse })
  async me(@CurrentUser() user: JwtPayload): Promise<UserProfileResponse> {
    return this.getCurrentUserUseCase.execute(user.sub);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password (requires current password)' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto): Promise<MessageResponse> {
    await this.changePasswordUseCase.execute(user.sub, dto);
    return { message: 'Contraseña actualizada. Todas las sesiones han sido cerradas.' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions' })
  @ApiResponse({ status: 200, type: [SessionResponse] })
  async sessions(@CurrentUser() user: JwtPayload): Promise<SessionResponse[]> {
    return this.listActiveSessionsUseCase.execute(user.sub);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async revokeSession(@CurrentUser() user: JwtPayload, @Param('id') sessionId: string): Promise<MessageResponse> {
    await this.revokeSessionUseCase.execute(user.sub, sessionId);
    return { message: 'Sesión revocada.' };
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request / resend OTP (app subscribers)' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async requestOtp(@Body() dto: RequestOtpDto): Promise<MessageResponse> {
    return this.requestOtpUseCase.execute(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP (standalone)' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    return this.verifyOtpUseCase.execute(dto);
  }
}
