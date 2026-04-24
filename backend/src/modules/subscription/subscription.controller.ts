import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/presentation/guards/permissions.guard';
import { Permissions } from '../auth/presentation/decorators/permissions.decorator';

@Controller('subscription')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ─── Create subscription (CMS or automated) ────────────────────────────────

  @Post()
  @Permissions('cms:subscriptions:create')
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  // ─── Access check (used by app middleware / internal services) ──────────────

  @Get('access/:customerId')
  @Permissions('cms:subscriptions:read')
  checkAccess(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.subscriptionService.checkAccess(customerId);
  }

  // ─── List subscriptions for a customer ─────────────────────────────────────

  @Get('customer/:customerId')
  @Permissions('cms:subscriptions:read')
  listByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.subscriptionService.listCustomerSubscriptions(customerId);
  }

  // ─── Get single subscription ────────────────────────────────────────────────

  @Get(':id')
  @Permissions('cms:subscriptions:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.getSubscriptionById(id);
  }

  // ─── Process payment / renewal ─────────────────────────────────────────────

  @Post(':id/payment')
  @Permissions('cms:subscriptions:renew')
  processPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.subscriptionService.processPayment(id, dto);
  }

  // ─── Cancel ─────────────────────────────────────────────────────────────────

  @Post(':id/cancel')
  @Permissions('cms:subscriptions:cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.cancelSubscription(id);
  }
}
