import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { BillingModule } from './modules/billing/billing.module';
import { CrmModule } from './modules/crm/crm.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { AdminModule } from './modules/admin/admin.module';

/**
 * Root application module.
 *
 * Imports all feature modules and configures global concerns:
 * - {@link ConfigModule} — loads environment variables from .env
 * - {@link ThrottlerModule} — rate limiting (20 requests per 60 s)
 * - {@link AuthModule} — authentication and session management
 * - {@link AccessControlModule} — role/permission guards
 * - {@link BillingModule} — ISP billing gateway
 * - {@link CrmModule} — customer relationship management gateway
 * - {@link ProfilesModule} — user profiles (placeholder)
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AccessControlModule,
    BillingModule,
    CrmModule,
    ProfilesModule,
    AdminModule,
  ],
})
export class AppModule {}
