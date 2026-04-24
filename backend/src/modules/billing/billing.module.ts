import { Module } from '@nestjs/common';
import { BILLING_GATEWAY } from './domain/interfaces/billing.gateway';
import { MockBillingGateway } from './infrastructure/adapters/mock-billing.gateway';

/**
 * Billing module that provides the {@link BillingGateway} port.
 *
 * Currently bound to {@link MockBillingGateway}; swap the `useClass`
 * for a real HTTP adapter when the ISP billing API is available.
 */
@Module({
  providers: [
    {
      provide: BILLING_GATEWAY,
      useClass: MockBillingGateway,
    },
  ],
  exports: [BILLING_GATEWAY],
})
export class BillingModule {}
