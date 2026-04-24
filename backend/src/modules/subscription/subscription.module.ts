import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionNotificationWorker } from './workers/subscription-notification.worker';
import { SubscriptionAccessGuard } from './guards/subscription-access.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    SubscriptionNotificationWorker,
    SubscriptionAccessGuard,
  ],
  exports: [SubscriptionService, SubscriptionAccessGuard],
})
export class SubscriptionModule {}
