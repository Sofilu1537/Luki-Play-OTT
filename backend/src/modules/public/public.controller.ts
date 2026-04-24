import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from '../admin/admin.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({
    summary:
      'Get active OTT components with their categories (public, no auth)',
  })
  @Get('componentes')
  async getActiveComponentes() {
    const all = await this.adminService.getComponentes();
    return all
      .filter((c) => c.activo)
      .map(({ id, nombre, tipo, icono, orden, categories }) => ({
        id,
        nombre,
        tipo,
        icono,
        orden,
        categories: (categories ?? []).filter((cat) => cat.activo),
      }));
  }
}
