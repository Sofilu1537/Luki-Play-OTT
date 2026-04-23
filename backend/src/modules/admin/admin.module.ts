import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ChannelHealthService } from './channel-health.service';
import { HlsValidatorService } from './hls-validator.service';
import { AuthModule } from '../auth/auth.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, AccessControlModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, ChannelHealthService, HlsValidatorService],
  exports: [AdminService, HlsValidatorService],
})
export class AdminModule {}
