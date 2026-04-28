import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../admin/admin.service';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly adminService: AdminService) {}

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
    const canal = (all ?? []).find((c: any) => c.id === id);
    if (!canal) throw new NotFoundException('Canal no encontrado');
    return { streamUrl: canal.streamUrl };
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
}
