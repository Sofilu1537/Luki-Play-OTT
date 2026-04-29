import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/presentation/guards/permissions.guard';
import { Permissions } from '../auth/presentation/decorators/permissions.decorator';
import { AdminService } from './admin.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateSubscriptionDto } from '../subscription/dto/create-subscription.dto';
import { ProcessPaymentDto } from '../subscription/dto/process-payment.dto';
import { CreateCanalDto } from './dto/create-canal.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateComponenteDto } from './dto/create-componente.dto';
import { UpdateComponenteDto } from './dto/update-componente.dto';
import { SetUserPasswordDto } from './dto/set-user-password.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { HlsValidatorService } from './hls-validator.service';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly hlsValidator: HlsValidatorService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ---- Email health check --------------------------------------------------

  @ApiOperation({ summary: 'Verify SMTP connectivity and optionally send a test email' })
  @Permissions('cms:*')
  @Get('health/email')
  async emailHealthCheck(@Query('to') to?: string) {
    return this.adminService.emailHealthCheck(to);
  }

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
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @ApiOperation({ summary: 'Reset or change a user password (admin)' })
  @Permissions('cms:users:write')
  @Post('users/:id/password')
  async setUserPassword(
    @Param('id') id: string,
    @Body() dto: SetUserPasswordDto,
  ) {
    return this.adminService.setUserPassword(id, dto);
  }

  @ApiOperation({
    summary: 'Auto-generate a secure password and send it by email (admin)',
  })
  @Permissions('cms:users:write')
  @Post('users/:id/generate-password')
  @HttpCode(HttpStatus.OK)
  async generateAndSendPassword(@Param('id') id: string) {
    return this.adminService.generateAndSendPassword(id);
  }

  @ApiOperation({
    summary:
      'Generate a 6-character recovery code and send it by email (admin)',
  })
  @Permissions('cms:users:write')
  @Post('users/:id/recovery-code')
  @HttpCode(HttpStatus.OK)
  async sendRecoveryCode(
    @Param('id') id: string,
    @Body() body: { email?: string },
  ) {
    return this.adminService.sendRecoveryCode(id, body.email);
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
  async revokeUserSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
  ) {
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

  @ApiOperation({ summary: 'List all CMS roles with their permissions' })
  @Permissions('cms:roles')
  @Get('roles')
  async getCmsRoles() {
    return this.adminService.getCmsRoles();
  }

  @ApiOperation({
    summary: 'Update permissions for a CMS role (ADMIN or SOPORTE only)',
  })
  @Permissions('cms:roles')
  @Patch('roles/:key/permissions')
  async updateRolePermissions(
    @Param('key') key: string,
    @Body() body: UpdateRolePermissionsDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.sub ?? 'system';
    return this.adminService.updateCmsRolePermissions(key, body.permissions, actorId);
  }

  @ApiOperation({ summary: 'Get available CMS permission modules' })
  @Permissions('cms:roles')
  @Get('permissions/modules')
  async getPermissionModules() {
    return this.adminService.getPermissionModules();
  }

  // ---- Monitor -------------------------------------------------------------

  @ApiOperation({ summary: 'Get system monitor stats' })
  @Permissions('cms:monitor:read')
  @Get('monitor')
  async getMonitorStats() {
    return this.adminService.getMonitorStats();
  }

  // ---- Stub routes for future modules --------------------------------------

  @Permissions('cms:planes:read')
  @Get('planes')
  getPlanes() {
    return this.adminService.getPlanes();
  }

  @Permissions('cms:planes:write')
  @Post('planes')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }

  @Permissions('cms:planes:write')
  @Patch('planes/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }

  @Permissions('cms:planes:write')
  @Post('planes/:id/toggle')
  @HttpCode(HttpStatus.OK)
  togglePlan(@Param('id') id: string) {
    return this.adminService.togglePlan(id);
  }

  @Permissions('cms:planes:write')
  @Delete('planes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  // ---- Sliders ---------------------------------------------------------------

  @ApiOperation({ summary: 'List all sliders/banners' })
  @Permissions('cms:sliders:read')
  @Get('sliders')
  getSliders() {
    return this.adminService.getSliders();
  }

  @ApiOperation({ summary: 'Upload a slider banner image' })
  @Permissions('cms:sliders:write')
  @Post('sliders/upload-imagen')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'sliders');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new BadRequestException('Solo se permiten archivos de imagen'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadSliderImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se subió ningún archivo');
    return { url: `/uploads/sliders/${file.filename}` };
  }

  @ApiOperation({ summary: 'Create a slider/banner' })
  @Permissions('cms:sliders:write')
  @Post('sliders')
  @HttpCode(HttpStatus.CREATED)
  createSlider(@Body() dto: CreateSliderDto) {
    return this.adminService.createSlider(dto);
  }

  @ApiOperation({ summary: 'Update a slider/banner' })
  @Permissions('cms:sliders:write')
  @Patch('sliders/:id')
  updateSlider(@Param('id') id: string, @Body() dto: UpdateSliderDto) {
    return this.adminService.updateSlider(id, dto);
  }

  @ApiOperation({ summary: 'Toggle slider active state' })
  @Permissions('cms:sliders:write')
  @Post('sliders/:id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleSlider(@Param('id') id: string) {
    return this.adminService.toggleSlider(id);
  }

  @ApiOperation({ summary: 'Reorder sliders by IDs array' })
  @Permissions('cms:sliders:write')
  @Post('sliders/reorder')
  @HttpCode(HttpStatus.OK)
  reorderSliders(@Body() body: { orderedIds: string[] }) {
    return this.adminService.reorderSliders(body.orderedIds ?? []);
  }

  @ApiOperation({ summary: 'Delete a slider/banner' })
  @Permissions('cms:sliders:write')
  @Delete('sliders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSlider(@Param('id') id: string) {
    return this.adminService.deleteSlider(id);
  }

  @ApiOperation({ summary: 'List all channels' })
  @Permissions('cms:canales:read')
  @Get('canales')
  getCanales(@Request() req: any) {
    const perms: string[] = req.user?.permissions ?? [];
    const canSeeUrls =
      perms.includes('cms:*') ||
      perms.includes('cms:canales:write') ||
      perms.includes('cms:canales');
    return this.adminService.getCanales(canSeeUrls);
  }

  @ApiOperation({ summary: 'Upload a channel logo image' })
  @Permissions('cms:canales:write')
  @Post('canales/upload-logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'logos');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new BadRequestException('Only image files are allowed'), false);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadChannelLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/logos/${file.filename}` };
  }

  @ApiOperation({ summary: 'Create a channel' })
  @Permissions('cms:canales:write')
  @Post('canales')
  createCanal(@Body() dto: CreateCanalDto) {
    return this.adminService.createCanal(dto);
  }

  @ApiOperation({ summary: 'Update a channel' })
  @Permissions('cms:canales:write')
  @Patch('canales/:id')
  updateCanal(@Param('id') id: string, @Body() dto: UpdateCanalDto) {
    return this.adminService.updateCanal(id, dto);
  }

  @ApiOperation({ summary: 'Toggle channel active state' })
  @Permissions('cms:canales:write')
  @Post('canales/:id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleCanal(@Param('id') id: string) {
    return this.adminService.toggleCanal(id);
  }

  @ApiOperation({ summary: 'Delete a channel' })
  @Permissions('cms:canales:write')
  @Delete('canales/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCanal(@Param('id') id: string) {
    return this.adminService.deleteCanal(id);
  }

  @ApiOperation({ summary: 'Validate an HLS stream URL' })
  @Permissions('cms:canales:read')
  @Post('canales/validate-stream')
  validateStream(@Body() body: { url: string }) {
    return this.hlsValidator.validate(body.url);
  }

  @ApiOperation({ summary: 'List all categories' })
  @Permissions('cms:categorias:read')
  @Get('categorias')
  getCategorias(
    @Query('active') active?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getCategorias({ active, search, limit, offset });
  }

  @ApiOperation({ summary: 'Get single category by ID' })
  @Permissions('cms:categorias:read')
  @Get('categorias/:id')
  getCategoriaById(@Param('id') id: string) {
    return this.adminService.getCategoriaById(id);
  }

  @ApiOperation({ summary: 'Create a category' })
  @Permissions('cms:categorias:write')
  @Post('categorias')
  createCategoria(@Body() dto: CreateCategoriaDto) {
    return this.adminService.createCategoria(dto);
  }

  @ApiOperation({ summary: 'Update a category' })
  @Permissions('cms:categorias:write')
  @Patch('categorias/:id')
  updateCategoria(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.adminService.updateCategoria(id, dto);
  }

  @ApiOperation({ summary: 'Toggle category active state' })
  @Permissions('cms:categorias:write')
  @Post('categorias/:id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleCategoria(@Param('id') id: string) {
    return this.adminService.toggleCategoria(id);
  }

  @ApiOperation({ summary: 'Sync channels for a category' })
  @Permissions('cms:categorias:write')
  @Post('categorias/:id/canales')
  @HttpCode(HttpStatus.OK)
  syncCategoriaCanales(
    @Param('id') id: string,
    @Body() body: { channelIds: string[] },
  ) {
    return this.adminService.syncCategoryChannels(id, body.channelIds ?? []);
  }

  @ApiOperation({ summary: 'Remove a channel from a category' })
  @Permissions('cms:categorias:write')
  @Delete('categorias/:id/canales/:channelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCategoriaCanal(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
  ) {
    return this.adminService.removeCategoryChannel(id, channelId);
  }

  @ApiOperation({ summary: 'Bulk reorder categories' })
  @Permissions('cms:categorias:write')
  @Patch('categorias/reorder/bulk')
  @HttpCode(HttpStatus.OK)
  bulkReorderCategorias(
    @Body() body: { items: { id: string; displayOrder: number }[] },
  ) {
    return this.adminService.bulkReorderCategorias(body.items ?? []);
  }

  @ApiOperation({ summary: 'Delete a category (soft delete)' })
  @Permissions('cms:categorias:write')
  @Delete('categorias/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategoria(@Param('id') id: string) {
    return this.adminService.deleteCategoria(id);
  }

  @Get('blog')
  getBlog() {
    return this.adminService.getBlog();
  }

  @Get('impuestos')
  getImpuestos() {
    return this.adminService.getImpuestos();
  }

  // ---- Componentes (content types visible to subscribers) ------------------

  @ApiOperation({ summary: 'List all OTT components' })
  @Permissions('cms:componentes:read')
  @Get('componentes')
  getComponentes() {
    return this.adminService.getComponentes();
  }

  @ApiOperation({ summary: 'Create a new OTT component' })
  @Permissions('cms:componentes:write')
  @Post('componentes')
  @HttpCode(HttpStatus.CREATED)
  createComponente(@Body() body: CreateComponenteDto) {
    return this.adminService.createComponente(body);
  }

  @ApiOperation({ summary: 'Update an OTT component' })
  @Permissions('cms:componentes:write')
  @Patch('componentes/:id')
  updateComponente(@Param('id') id: string, @Body() body: UpdateComponenteDto) {
    return this.adminService.updateComponente(id, body);
  }

  @ApiOperation({ summary: 'Delete an OTT component' })
  @Permissions('cms:componentes:write')
  @Delete('componentes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComponente(@Param('id') id: string) {
    return this.adminService.deleteComponente(id);
  }

  @ApiOperation({ summary: 'Toggle a component active/inactive' })
  @Permissions('cms:componentes:write')
  @Post('componentes/:id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleComponente(@Param('id') id: string) {
    return this.adminService.toggleComponente(id);
  }

  @ApiOperation({ summary: 'Update component order' })
  @Permissions('cms:componentes:write')
  @Post('componentes/reorder')
  @HttpCode(HttpStatus.OK)
  reorderComponentes(@Body() body: { ids: string[] }) {
    return this.adminService.reorderComponentes(body.ids);
  }

  @ApiOperation({ summary: 'Get categories assigned to a component' })
  @Permissions('cms:componentes:read')
  @Get('componentes/:id/categorias')
  getComponenteCategorias(@Param('id') id: string) {
    return this.adminService.getComponenteById(id);
  }

  @ApiOperation({ summary: 'Sync categories for a component' })
  @Permissions('cms:componentes:write')
  @Post('componentes/:id/categorias')
  @HttpCode(HttpStatus.OK)
  syncComponenteCategorias(
    @Param('id') id: string,
    @Body() body: { categoryIds: string[] },
  ) {
    return this.adminService.syncComponentCategories(
      id,
      body.categoryIds ?? [],
    );
  }

  // ---- Componentes: public endpoint (no auth required) --------------------

  // ─── Registration Requests (Flujo 3) ─────────────────────────────────────

  @ApiOperation({ summary: 'Listar solicitudes de registro (no-ISP)' })
  @Permissions('cms:users:read')
  @Get('registration-requests')
  listRegistrationRequests(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listRegistrationRequests(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @ApiOperation({ summary: 'Detalle de solicitud de registro' })
  @Permissions('cms:users:read')
  @Get('registration-requests/:id')
  getRegistrationRequest(@Param('id') id: string) {
    return this.adminService.getRegistrationRequest(id);
  }

  @ApiOperation({
    summary:
      'Aprobar solicitud: crea customer + contract + código de activación',
  })
  @Permissions('cms:users:write')
  @Post('registration-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveRegistrationRequest(
    @Param('id') id: string,
    @Body() body: { contractNumber: string; maxDevices?: number },
    @Request() req: any,
  ) {
    const actorId = req.user?.sub ?? 'system';
    return this.adminService.approveRegistrationRequest(
      id,
      body.contractNumber,
      body.maxDevices,
      actorId,
    );
  }

  @ApiOperation({ summary: 'Rechazar solicitud de registro' })
  @Permissions('cms:users:write')
  @Post('registration-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectRegistrationRequest(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    const actorId = req.user?.sub ?? 'system';
    return this.adminService.rejectRegistrationRequest(
      id,
      body.reason,
      actorId,
    );
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Crear suscripción manual para un cliente' })
  @Permissions('cms:subscriptions:create')
  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  @ApiOperation({ summary: 'Obtener suscripciones de un cliente' })
  @Permissions('cms:subscriptions:read')
  @Get('subscriptions/customer/:customerId')
  listCustomerSubscriptions(@Param('customerId') customerId: string) {
    return this.subscriptionService.listCustomerSubscriptions(customerId);
  }

  @ApiOperation({ summary: 'Verificar acceso de un cliente' })
  @Permissions('cms:subscriptions:read')
  @Get('subscriptions/access/:customerId')
  checkSubscriptionAccess(@Param('customerId') customerId: string) {
    return this.subscriptionService.checkAccess(customerId);
  }

  @ApiOperation({ summary: 'Ver detalle de suscripción' })
  @Permissions('cms:subscriptions:read')
  @Get('subscriptions/:id')
  getSubscription(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionById(id);
  }

  @ApiOperation({ summary: 'Registrar pago / renovar suscripción' })
  @Permissions('cms:subscriptions:renew')
  @Post('subscriptions/:id/payment')
  @HttpCode(HttpStatus.OK)
  processPayment(@Param('id') id: string, @Body() dto: ProcessPaymentDto) {
    return this.subscriptionService.processPayment(id, dto);
  }

  @ApiOperation({ summary: 'Cancelar suscripción' })
  @Permissions('cms:subscriptions:cancel')
  @Post('subscriptions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelSubscription(@Param('id') id: string) {
    return this.subscriptionService.cancelSubscription(id);
  }
}
