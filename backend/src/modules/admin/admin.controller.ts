import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---- Users ---------------------------------------------------------------

  @ApiOperation({ summary: 'List all users (admin)' })
  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @ApiOperation({ summary: 'Create a new user (admin)' })
  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @ApiOperation({ summary: 'Delete a user (admin)' })
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @ApiOperation({ summary: 'Generate and send a new password to a user by email (admin)' })
  @Post('users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  async generateAndSendPassword(@Param('id') id: string) {
    return this.adminService.generateAndSendPassword(id);
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
