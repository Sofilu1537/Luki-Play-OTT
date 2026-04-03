import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from '../admin/admin.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Get active OTT components (public, no auth)' })
  @Get('componentes')
  getActiveComponentes() {
    return this.adminService
      .getComponentes()
      .filter((c) => c.activo)
      .map(({ id, nombre, tipo, icono, orden }) => ({ id, nombre, tipo, icono, orden }));
  }
}
