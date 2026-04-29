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
import { SendRecoveryCodeUseCase } from '../../application/use-cases/send-recovery-code.use-case';
import { GenerateActivationCodeUseCase } from '../../application/use-cases/generate-activation-code.use-case';
import { ActivateAccountUseCase } from '../../application/use-cases/activate-account.use-case';
import { ResetPasswordWithCodeUseCase } from '../../application/use-cases/reset-password-with-code.use-case';
import { RegisterAppUseCase } from '../../application/use-cases/register-app.use-case';
import { ContractLoginUseCase } from '../../application/use-cases/contract-login.use-case.js';
import { FirstAccessAppUseCase } from '../../application/use-cases/first-access-app.use-case.js';
import { ActivateAppUseCase2 } from '../../application/use-cases/activate-app.use-case.js';
import { SwitchContractUseCase } from '../../application/use-cases/switch-contract.use-case.js';
import { ContractResetPasswordUseCase } from '../../application/use-cases/contract-reset-password.use-case.js';
import { RequestActivationCodeUseCase } from '../../application/use-cases/request-activation-code.use-case.js';
import { VerifyActivationCodeUseCase } from '../../application/use-cases/verify-activation-code.use-case.js';
import { SubmitRegistrationRequestUseCase } from '../../application/use-cases/submit-registration-request.use-case.js';
import { IdNumberLoginUseCase } from '../../application/use-cases/id-number-login.use-case.js';
import { RequestPasswordOtpUseCase } from '../../application/use-cases/request-password-otp.use-case.js';
import { ResetPasswordOtpUseCase } from '../../application/use-cases/reset-password-otp.use-case.js';
import { RegisterAppDto } from '../../application/dto/register-app.dto';
import { ContractLoginDto } from '../../application/dto/contract-login.dto.js';
import { FirstAccessAppDto } from '../../application/dto/first-access-app.dto.js';
import { ActivateAppDto } from '../../application/dto/activate-app.dto.js';
import { SwitchContractDto } from '../../application/dto/switch-contract.dto.js';
import { ContractResetPasswordDto } from '../../application/dto/contract-reset-password.dto.js';
import { RequestActivationCodeDto } from '../../application/dto/request-activation-code.dto.js';
import { VerifyActivationCodeDto } from '../../application/dto/verify-activation-code.dto.js';
import { SubmitRegistrationRequestDto } from '../../application/dto/submit-registration-request.dto.js';
import { IdNumberLoginDto } from '../../application/dto/id-number-login.dto.js';
import { RequestPasswordOtpDto } from '../../application/dto/request-password-otp.dto.js';
import { ResetPasswordOtpDto } from '../../application/dto/reset-password-otp.dto.js';
import { LoginAppDto } from '../../application/dto/login-app.dto';
import { LoginCmsDto } from '../../application/dto/login-cms.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../application/dto/reset-password.dto';
import { CompleteFirstAccessDto } from '../../application/dto/first-access.dto';
import { SendRecoveryCodeDto } from '../../application/dto/send-recovery-code.dto';
import { GenerateActivationCodeDto } from '../../application/dto/generate-activation-code.dto';
import { ActivateAccountDto } from '../../application/dto/activate-account.dto';
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
    private readonly sendRecoveryCodeUseCase: SendRecoveryCodeUseCase,
    private readonly generateActivationCodeUseCase: GenerateActivationCodeUseCase,
    private readonly activateAccountUseCase: ActivateAccountUseCase,
    private readonly resetPasswordWithCodeUseCase: ResetPasswordWithCodeUseCase,
    private readonly registerAppUseCase: RegisterAppUseCase,
    private readonly contractLoginUseCase: ContractLoginUseCase,
    private readonly firstAccessAppUseCase: FirstAccessAppUseCase,
    private readonly activateAppUseCase: ActivateAppUseCase2,
    private readonly switchContractUseCase: SwitchContractUseCase,
    private readonly contractResetPasswordUseCase: ContractResetPasswordUseCase,
    private readonly requestActivationCodeUseCase: RequestActivationCodeUseCase,
    private readonly verifyActivationCodeUseCase: VerifyActivationCodeUseCase,
    private readonly submitRegistrationRequestUseCase: SubmitRegistrationRequestUseCase,
    private readonly idNumberLoginUseCase: IdNumberLoginUseCase,
    private readonly requestPasswordOtpUseCase: RequestPasswordOtpUseCase,
    private readonly resetPasswordOtpUseCase: ResetPasswordOtpUseCase,
  ) {}

  @Post('app/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new subscriber account' })
  @ApiResponse({ status: 201, type: LoginChallengeResponse })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado' })
  async registerApp(
    @Body() dto: RegisterAppDto,
  ): Promise<{ message: string; loginToken: string; otpRequired: boolean }> {
    return this.registerAppUseCase.execute(dto);
  }

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
  async completeLogin(
    @Body() dto: VerifyLoginOtpDto,
  ): Promise<AuthTokensResponse> {
    return this.completeLoginUseCase.execute(dto);
  }

  @Post('cms/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'CMS login — email + password. Rate limited.' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta bloqueada',
  })
  async loginCms(
    @Body() dto: LoginCmsDto,
    @Req() req: Request,
  ): Promise<AuthTokensResponse> {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.loginCmsUseCase.execute(dto, ip);
  }

  @Post('cms/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password recovery email (anti-enumeration: always 200)',
  })
  @ApiResponse({ status: 200, type: MessageResponse })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponse> {
    await this.forgotPasswordUseCase.execute(dto.email);
    return {
      message:
        'Si el correo está registrado, recibirás las instrucciones en breve.',
    };
  }

  @Post('send-recovery-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send recovery code to user email' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async sendRecoveryCode(
    @Body() dto: SendRecoveryCodeDto,
  ): Promise<{ message: string }> {
    await this.sendRecoveryCodeUseCase.execute(dto.email);
    return {
      message:
        'Si el correo está registrado, recibirás un código de recuperación.',
    };
  }

  @Post('cms/send-recovery-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Send recovery code — CMS internal users only (SUPERADMIN/SOPORTE)',
  })
  @ApiResponse({ status: 200, type: MessageResponse })
  @ApiResponse({
    status: 403,
    description: 'El correo no pertenece a un usuario interno',
  })
  async cmsSendRecoveryCode(
    @Body() dto: SendRecoveryCodeDto,
  ): Promise<{ message: string; code?: string }> {
    const rawCode = await this.sendRecoveryCodeUseCase.execute(dto.email, true);
    return {
      message: 'Código de recuperación generado.',
      code: rawCode,
    };
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
  @ApiOperation({
    summary: 'Complete first access — set password and get session',
  })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  async completeFirstAccess(
    @Body() dto: CompleteFirstAccessDto,
  ): Promise<AuthTokensResponse> {
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
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RefreshTokenDto,
  ): Promise<MessageResponse> {
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
  @ApiOperation({
    summary: 'Change current user password (requires current password)',
  })
  @ApiResponse({ status: 200, type: MessageResponse })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponse> {
    await this.changePasswordUseCase.execute(user.sub, dto);
    return {
      message: 'Contraseña actualizada. Todas las sesiones han sido cerradas.',
    };
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
  async revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') sessionId: string,
  ): Promise<MessageResponse> {
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

  @Post('generate-activation-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate and send activation code for a new user' })
  @ApiResponse({ status: 200 })
  async generateActivationCode(
    @Body() dto: GenerateActivationCodeDto,
  ): Promise<{ message: string; code: string }> {
    const result = await this.generateActivationCodeUseCase.execute(
      dto.userId,
      dto.email,
      'admin',
    );
    return { message: 'Código de activación enviado.', code: result.code };
  }

  @Post('activate-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate account with code and set password' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async activateAccount(
    @Body() dto: ActivateAccountDto,
  ): Promise<MessageResponse> {
    if (dto.newPassword !== dto.confirmPassword) {
      return { message: 'Las contraseñas no coinciden.' };
    }
    return this.activateAccountUseCase.execute(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }

  @Post('app/reset-with-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using recovery code sent to email' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async resetWithCode(
    @Body()
    dto: {
      email: string;
      code: string;
      newPassword: string;
      confirmPassword: string;
    },
  ): Promise<MessageResponse> {
    if (dto.newPassword !== dto.confirmPassword) {
      return { message: 'Las contraseñas no coinciden.' };
    }
    await this.resetPasswordWithCodeUseCase.execute(
      dto.email,
      dto.code,
      dto.newPassword,
    );
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }

  @Post('cms/reset-with-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Reset password using recovery code — CMS internal users only (SUPERADMIN/ADMIN/SOPORTE)',
  })
  @ApiResponse({ status: 200, type: MessageResponse })
  @ApiResponse({
    status: 403,
    description: 'El correo no pertenece a un usuario interno',
  })
  async cmsResetWithCode(
    @Body()
    dto: {
      email: string;
      code: string;
      newPassword: string;
      confirmPassword: string;
    },
  ): Promise<MessageResponse> {
    if (dto.newPassword !== dto.confirmPassword) {
      return { message: 'Las contraseñas no coinciden.' };
    }
    await this.resetPasswordWithCodeUseCase.execute(
      dto.email,
      dto.code,
      dto.newPassword,
      true,
    );
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }

  // ─── Contract-based auth (subscribers) ───────────────────

  @Post('app/contract-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login con número de contrato + contraseña (sin OTP)',
  })
  async contractLogin(@Body() dto: ContractLoginDto) {
    return this.contractLoginUseCase.execute(dto);
  }

  @Post('app/first-access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Primera vez: verificar contrato + cédula' })
  async firstAccess(@Body() dto: FirstAccessAppDto) {
    return this.firstAccessAppUseCase.execute(dto);
  }

  @Post('app/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar cuenta: establecer contraseña' })
  async activateApp(@Body() dto: ActivateAppDto) {
    return this.activateAppUseCase.execute(dto);
  }

  @Post('app/switch-contract')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar al contrato seleccionado' })
  async switchContract(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SwitchContractDto,
  ) {
    return this.switchContractUseCase.execute(user.sub, dto.contractId);
  }

  @Post('app/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password via contrato + cédula' })
  async contractResetPassword(@Body() dto: ContractResetPasswordDto) {
    return this.contractResetPasswordUseCase.execute(dto);
  }

  @Post('app/request-activation-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar código de activación (con o sin email)' })
  async requestActivationCode(@Body() dto: RequestActivationCodeDto) {
    return this.requestActivationCodeUseCase.execute(dto);
  }

  @Post('app/verify-activation-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código de activación antes de crear contraseña',
  })
  async verifyActivationCode(@Body() dto: VerifyActivationCodeDto) {
    return this.verifyActivationCodeUseCase.execute(dto);
  }

  @Post('app/registration-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar registro para cliente no-ISP (Flujo 3)' })
  async submitRegistrationRequest(@Body() dto: SubmitRegistrationRequestDto) {
    return this.submitRegistrationRequestUseCase.execute(dto);
  }

  // ─── Autenticación por cédula + OTP recovery ─────────────

  @Post('app/id-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con cédula de identidad + contraseña' })
  async idNumberLogin(@Body() dto: IdNumberLoginDto) {
    return this.idNumberLoginUseCase.execute(dto);
  }

  @Post('app/request-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar OTP para recuperación de contraseña (por cédula)' })
  async requestPasswordOtp(@Body() dto: RequestPasswordOtpDto): Promise<{ message: string }> {
    return this.requestPasswordOtpUseCase.execute(dto);
  }

  @Post('app/reset-with-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña verificando OTP + cédula' })
  async resetPasswordWithOtp(@Body() dto: ResetPasswordOtpDto): Promise<{ message: string }> {
    return this.resetPasswordOtpUseCase.execute(dto);
  }
}
