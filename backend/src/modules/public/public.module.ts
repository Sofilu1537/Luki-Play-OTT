import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StreamSessionService } from './stream-session.service';
import { DeviceService } from './device.service';
import { ParentalControlService } from './parental-control.service';

@Module({
  imports: [AdminModule, AuthModule, PrismaModule],
  controllers: [PublicController],
  providers: [StreamSessionService, DeviceService, ParentalControlService],
  exports: [DeviceService, ParentalControlService],
})
export class PublicModule {}
