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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/presentation/guards/permissions.guard';
import { Permissions } from '../auth/presentation/decorators/permissions.decorator';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetUserPasswordDto } from './dto/set-user-password.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---- Users ---------------------------------------------------------------

  @ApiOperation({ summary: 'List all users (admin)' })
  @Permissions('cms:users:read')
  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @ApiOperation({ summary: 'Get a single user detail (admin)' })
  @Permissions('cms:users:read')
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @ApiOperation({ summary: 'Create a new user (admin)' })
  @Permissions('cms:users:write')
  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @ApiOperation({ summary: 'Delete a user (admin)' })
  @Permissions('cms:users:write')
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @ApiOperation({ summary: 'Update a user (admin)' })
  @Permissions('cms:users:write')
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @ApiOperation({ summary: 'Update user status (admin)' })
  @Permissions('cms:users:write')
  @Patch('users/:id/status')
  async updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @ApiOperation({ summary: 'Reset or change a user password (admin)' })
  @Permissions('cms:users:write')
  @Post('users/:id/password')
  async setUserPassword(@Param('id') id: string, @Body() dto: SetUserPasswordDto) {
    return this.adminService.setUserPassword(id, dto);
  }

  @ApiOperation({ summary: 'Auto-generate a secure password and send it by email (admin)' })
  @Permissions('cms:users:write')
  @Post('users/:id/generate-password')
  @HttpCode(HttpStatus.OK)
  async generateAndSendPassword(@Param('id') id: string) {
    return this.adminService.generateAndSendPassword(id);
  }

  @ApiOperation({ summary: 'List sessions for a user by device (admin)' })
  @Permissions('cms:users:read')
  @Get('users/:id/sessions')
  async listUserSessions(@Param('id') id: string) {
    return this.adminService.listUserSessions(id);
  }

  @ApiOperation({ summary: 'Revoke a single user session (admin)' })
  @Permissions('cms:users:write')
  @Delete('users/:id/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeUserSession(@Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.adminService.revokeUserSession(id, sessionId);
  }

  @ApiOperation({ summary: 'Revoke all sessions for a user (admin)' })
  @Permissions('cms:users:write')
  @Delete('users/:id/sessions')
  @HttpCode(HttpStatus.OK)
  async revokeAllUserSessions(@Param('id') id: string) {
    return this.adminService.revokeAllUserSessions(id);
  }

  @ApiOperation({ summary: 'Get contracted plan details for a user (admin)' })
  @Permissions('cms:users:read')
  @Get('users/:id/plan')
  async getUserPlan(@Param('id') id: string) {
    return this.adminService.getUserPlan(id);
  }

  // ---- Monitor -------------------------------------------------------------

  @ApiOperation({ summary: 'Get system monitor stats' })
  @Get('monitor')
  async getMonitorStats() {
    return this.adminService.getMonitorStats();
  }

  // ---- Stub routes for future modules --------------------------------------

  @Get('planes')
  getPlanes() { return this.adminService.getPlanes(); }

  @Post('planes')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }

  @Patch('planes/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }

  @Post('planes/:id/toggle')
  @HttpCode(HttpStatus.OK)
  togglePlan(@Param('id') id: string) {
    return this.adminService.togglePlan(id);
  }

  @Delete('planes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  @Get('sliders')
  getSliders() { return this.adminService.getSliders(); }

  @Get('canales')
  getCanales() { return this.adminService.getCanales(); }

  @Get('categorias')
  getCategorias() { return this.adminService.getCategorias(); }

  @Get('blog')
  getBlog() { return this.adminService.getBlog(); }

  @Get('impuestos')
  getImpuestos() { return this.adminService.getImpuestos(); }

  // ---- Componentes (content types visible to subscribers) ------------------

  @ApiOperation({ summary: 'List all OTT components' })
  @Get('componentes')
  getComponentes() { return this.adminService.getComponentes(); }

  @ApiOperation({ summary: 'Toggle a component active/inactive' })
  @Post('componentes/:id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleComponente(@Param('id') id: string) {
    return this.adminService.toggleComponente(id);
  }

  @ApiOperation({ summary: 'Update component order' })
  @Post('componentes/reorder')
  @HttpCode(HttpStatus.OK)
  reorderComponentes(@Body() body: { ids: string[] }) {
    return this.adminService.reorderComponentes(body.ids);
  }

  // ---- Componentes: public endpoint (no auth required) --------------------

}
