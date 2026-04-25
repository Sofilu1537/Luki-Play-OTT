import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from '../admin/admin.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Get active live channels for OTT player (public, no auth)' })
  @Get('canales')
  async getActiveCanales() {
    try {
      const all = await this.adminService.getCanales();
      return (all ?? [])
        .filter((c: any) => (c.status ? c.status === 'ACTIVE' : c.activo !== false))
        .map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          logo: c.logoUrl ?? c.logo ?? '📺',
          streamUrl: c.streamUrl,
          detalle: c.detalle ?? c.descripcion ?? '',
          categoria: c.category?.nombre ?? c.categoria ?? 'General',
          tipo: c.tipo ?? 'tv',
          requiereControlParental: c.requiereControlParental ?? false,
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
}
