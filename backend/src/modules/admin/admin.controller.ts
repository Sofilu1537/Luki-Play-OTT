import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateCmsUserDto as CreateCmsUserBodyDto } from './dto/create-cms-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreateCmsUserUseCase } from '../auth/application/use-cases/create-cms-user.use-case';
import { CurrentUser } from '../auth/presentation/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/domain/interfaces/token.service';
import { UserRole } from '../auth/domain/entities/user.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly createCmsUserUseCase: CreateCmsUserUseCase,
  ) {}

  // ---- CMS Users -----------------------------------------------------------

  @ApiOperation({ summary: 'List all users' })
  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @ApiOperation({ summary: 'Create subscriber user' })
  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @ApiOperation({ summary: 'Create CMS admin/soporte user — superadmin only' })
  @Post('cms-users')
  async createCmsUser(
    @Body() dto: CreateCmsUserBodyDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    if (actor.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el superadmin puede crear usuarios administrativos.');
    }
    return this.createCmsUserUseCase.execute({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      phone: dto.phone,
      createdBy: actor.sub,
    });
  }

  @ApiOperation({ summary: 'Update user status (activate/deactivate) — superadmin only' })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    if (actor.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el superadmin puede cambiar el estado de usuarios.');
    }
    return this.adminService.updateUserStatus(id, dto.status, actor.sub);
  }

  @ApiOperation({ summary: 'Delete (deactivate) a user — superadmin only' })
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    if (actor.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el superadmin puede eliminar usuarios.');
    }
    return this.adminService.deleteUser(id);
  }

  @ApiOperation({ summary: 'Revoke all sessions of a user — superadmin only' })
  @Delete('users/:id/sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeUserSessions(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    if (actor.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el superadmin puede revocar sesiones de otros usuarios.');
    }
    return this.adminService.revokeUserSessions(id, actor.sub);
  }

  // ---- Audit ---------------------------------------------------------------

  @ApiOperation({ summary: 'Get audit logs — superadmin only' })
  @Get('audit-logs')
  async getAuditLogs(@CurrentUser() actor: JwtPayload) {
    if (actor.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el superadmin puede ver los logs de auditoría.');
    }
    return this.adminService.getAuditLogs();
  }

  // ---- Monitor -------------------------------------------------------------

  @ApiOperation({ summary: 'Get system monitor stats' })
  @Get('monitor')
  async getMonitorStats() {
    return this.adminService.getMonitorStats();
  }

  // ---- Stub routes ---------------------------------------------------------

  @Get('planes')      getPlanes()     { return this.adminService.getPlanes(); }
  @Get('sliders')     getSliders()    { return this.adminService.getSliders(); }
  @Get('canales')     getCanales()    { return this.adminService.getCanales(); }
  @Get('categorias')  getCategorias() { return this.adminService.getCategorias(); }
  @Get('blog')        getBlog()       { return this.adminService.getBlog(); }
  @Get('impuestos')   getImpuestos()  { return this.adminService.getImpuestos(); }
}
