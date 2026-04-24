import { Module } from '@nestjs/common';
import { CRM_GATEWAY } from './domain/interfaces/crm.gateway';
import { MockCrmGateway } from './infrastructure/adapters/mock-crm.gateway';

/**
 * CRM module that provides the {@link CrmGateway} port.
 *
 * Currently bound to {@link MockCrmGateway}; swap the `useClass`
 * for a real HTTP adapter when the CRM system is available.
 */
@Module({
  providers: [
    {
      provide: CRM_GATEWAY,
      useClass: MockCrmGateway,
    },
  ],
  exports: [CRM_GATEWAY],
})
export class CrmModule {}
