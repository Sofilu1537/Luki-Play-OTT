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
}
