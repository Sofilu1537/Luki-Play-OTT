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

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly adminService: AdminService,
    private readonly streamSessionService: StreamSessionService,
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
}
