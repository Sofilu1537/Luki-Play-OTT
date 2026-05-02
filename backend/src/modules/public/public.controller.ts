import {
  Controller, Get, Param, Query, Body, Post, Patch, Delete,
  NotFoundException, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../admin/admin.service';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/presentation/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/domain/interfaces/token.service';
import { StreamSessionService } from './stream-session.service';
import { DeviceService } from './device.service';
import { ParentalControlService } from './parental-control.service';
import { DeviceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly adminService: AdminService,
    private readonly streamSessionService: StreamSessionService,
    private readonly deviceService: DeviceService,
    private readonly parentalControlService: ParentalControlService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Get active live channels for OTT player — no streamUrl (public, no auth)' })
  @Get('canales')
  async getActiveCanales() {
    try {
      const all = await this.adminService.getCanales(false);
      return (all ?? [])
        .filter((c: any) => (c.status ? c.status === 'ACTIVE' : c.activo !== false))
        .map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          logo: c.logoUrl ?? c.logo ?? '📺',
          detalle: c.detalle ?? c.descripcion ?? '',
          categoria: c.category?.nombre ?? c.categoria ?? 'General',
          tipo: c.tipo ?? 'tv',
          requiereControlParental: c.requiereControlParental ?? false,
        }));
    } catch {
      return [];
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get stream URL for a channel — requires auth' })
  @Get('canales/:id/stream')
  async getStreamUrl(@Param('id') id: string) {
    const all = await this.adminService.getCanales(true);
    const canal = (all ?? []).find((c: any) => c.id === id) as any;
    if (!canal) throw new NotFoundException('Canal no encontrado');
    return { streamUrl: canal.streamUrl as string };
  }

  @ApiOperation({ summary: 'Get active sliders/banners for the app (public, no auth)' })
  @Get('sliders')
  async getActiveSliders(@Query('planId') planId?: string) {
    try {
      const sliders = await this.adminService.getPublicSliders(planId);
      return sliders.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        subtitulo: s.subtitulo,
        imagen: s.imagen,
        imagenMobile: s.imagenMobile,
        actionType: s.actionType,
        actionValue: s.actionValue,
        orden: s.orden,
      }));
    } catch {
      return [];
    }
  }

  @ApiOperation({ summary: 'Get active OTT components with their categories (public, no auth)' })
  @Get('componentes')
  async getActiveComponentes() {
    try {
      const all = await this.adminService.getComponentes();
      return all
        .filter((c) => c.activo)
        .map(({ id, nombre, tipo, icono, orden, categories }) => ({
          id, nombre, tipo, icono, orden,
          categories: (categories ?? []).filter((cat) => cat.activo),
        }));
    } catch {
      return [];
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user plan + active subscription dates' })
  @Get('me/plan')
  async getMePlan(@CurrentUser() user: JwtPayload) {
    const [planRecord, subscription] = await Promise.all([
      this.adminService.getUserPlan(user.sub),
      this.streamSessionService.getMeSubscription(user.sub),
    ]);

    return {
      plan: {
        ...planRecord,
        precio: subscription?.plan?.precio ?? null,
        moneda: subscription?.plan?.moneda ?? 'USD',
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startDate: subscription.startDate,
            expirationDate: subscription.expirationDate,
            gracePeriodEnd: subscription.gracePeriodEnd ?? null,
          }
        : null,
    };
  }

  // ── Stream slot management ─────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reserve a concurrent stream slot' })
  @Post('streams/start')
  async startStream(
    @CurrentUser() user: JwtPayload,
    @Body() body: { channelId: string; deviceId: string; contractId?: string },
  ) {
    const streamId = await this.streamSessionService.startStream(
      user.sub,
      body.contractId,
      body.deviceId,
      body.channelId,
    );
    return { streamId };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Keep-alive heartbeat for a stream slot' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('streams/:id/heartbeat')
  async heartbeat(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.streamSessionService.heartbeat(id, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Release a stream slot' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('streams/:id')
  async stopStream(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.streamSessionService.stopStream(id, user.sub);
  }

  // ── Device management ─────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register or refresh a device fingerprint after login' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('devices/register')
  async registerDevice(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      deviceFingerprint: string;
      nombre?: string;
      tipo?: DeviceType;
      os?: string;
      browser?: string;
      modelo?: string;
    },
  ): Promise<void> {
    await this.deviceService.upsertDevice(user.sub, { ...body });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List registered devices for the authenticated user' })
  @Get('devices')
  async getDevices(
    @CurrentUser() user: JwtPayload,
    @Query('currentDevice') currentDevice?: string,
  ) {
    return this.deviceService.getDevices(user.sub, currentDevice);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Rename a registered device' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('devices/:fingerprint')
  async renameDevice(
    @CurrentUser() user: JwtPayload,
    @Param('fingerprint') fingerprint: string,
    @Body() body: { nombre: string },
  ): Promise<void> {
    await this.deviceService.renameDevice(user.sub, fingerprint, body.nombre);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a device and revoke its sessions' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('devices/:fingerprint')
  async removeDevice(
    @CurrentUser() user: JwtPayload,
    @Query('currentDevice') currentDevice: string,
    @Param('fingerprint') fingerprint: string,
  ): Promise<void> {
    await this.deviceService.removeDevice(user.sub, fingerprint, currentDevice);
  }

  // ── Active sessions (for security panel) ─────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List active sessions with device info for the authenticated user' })
  @Get('sessions')
  async getActiveSessions(
    @CurrentUser() user: JwtPayload,
    @Query('currentDevice') currentDevice?: string,
  ) {
    const now = new Date();
    const sessions = await this.prisma.session.findMany({
      where: {
        customerId: user.sub,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    const deviceMap = await this.prisma.device.findMany({
      where: { customerId: user.sub, deletedAt: null },
    }).then((ds) => new Map(ds.map((d) => [d.deviceFingerprint, d])));

    return sessions.map((s) => {
      const device = deviceMap.get(s.deviceId);
      return {
        id: s.id,
        deviceId: s.deviceId,
        audience: s.audience,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceName: device?.nombre ?? null,
        deviceTipo: device?.tipo ?? null,
        deviceOs: device?.os ?? null,
        deviceBrowser: device?.browser ?? null,
        isCurrentDevice: s.deviceId === currentDevice,
      };
    });
  }

  // ── Control Parental ──────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get parental control status for the authenticated user' })
  @Get('parental-control')
  async getParentalControl(@CurrentUser() user: JwtPayload) {
    return this.parentalControlService.getStatus(user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable parental control with a 4-digit PIN' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('parental-control/enable')
  async enableParentalControl(
    @CurrentUser() user: JwtPayload,
    @Body() body: { pin: string },
  ): Promise<void> {
    await this.parentalControlService.enable(user.sub, body.pin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable parental control — requires PIN verification' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('parental-control/disable')
  async disableParentalControl(
    @CurrentUser() user: JwtPayload,
    @Body() body: { pin: string },
  ): Promise<void> {
    await this.parentalControlService.disable(user.sub, body.pin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify parental control PIN for restricted content' })
  @Post('parental-control/verify')
  async verifyParentalPin(
    @CurrentUser() user: JwtPayload,
    @Body() body: { pin: string },
  ) {
    return this.parentalControlService.verifyPin(user.sub, body.pin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change parental control PIN' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('parental-control/pin')
  async changeParentalPin(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPin: string; newPin: string },
  ): Promise<void> {
    await this.parentalControlService.changePin(user.sub, body.currentPin, body.newPin);
  }
}
