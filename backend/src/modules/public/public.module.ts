import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { AdminModule } from '../admin/admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StreamSessionService } from './stream-session.service';
import { DeviceService } from './device.service';

@Module({
  imports: [AdminModule, PrismaModule],
  controllers: [PublicController],
  providers: [StreamSessionService, DeviceService],
  exports: [DeviceService],
})
export class PublicModule {}
