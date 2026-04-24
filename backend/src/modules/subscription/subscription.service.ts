import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Subscription, Payment } from '@prisma/client';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

export interface SubscriptionAccess {
  hasAccess: boolean;
  status: string | null;
  subscription: Subscription | null;
  reason?: string;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * Creates a new subscription for a customer purchasing a plan.
   * Calculates expiration_date and grace_period_end from the plan's rules
   * and stores an immutable snapshot of those rules in planSnapshot.
   */
  async createSubscription(dto: CreateSubscriptionDto): Promise<Subscription> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException(`Plan ${dto.planId} not found`);
    if (!plan.activo) throw new BadRequestException('Plan is not active');

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer)
      throw new NotFoundException(`Customer ${dto.customerId} not found`);

    const startDate = new Date();
    const expirationDate = addDays(startDate, plan.duracionDias);
    const gracePeriodHours = plan.gracePeriodDays * 24;
    const gracePeriodEnd =
      gracePeriodHours > 0 ? addHours(expirationDate, gracePeriodHours) : null;

    const planSnapshot = {
      nombre: plan.nombre,
      precio: plan.precio,
      moneda: plan.moneda,
      duracionDias: plan.duracionDias,
      gracePeriodDays: plan.gracePeriodDays,
      gracePeriodHours,
      maxDevices: plan.maxDevices,
      maxConcurrentStreams: plan.maxConcurrentStreams,
      maxProfiles: plan.maxProfiles,
      videoQuality: plan.videoQuality,
      entitlements: plan.entitlements,
      trialDays: plan.trialDays,
    };

    const subscription = await this.prisma.subscription.create({
      data: {
        customerId: dto.customerId,
        planId: dto.planId,
        startDate,
        expirationDate,
        gracePeriodEnd,
        status: 'ACTIVE',
        planSnapshot,
      },
    });

    this.logger.log(
      `Subscription created — customer=${dto.customerId} plan=${plan.nombre} expires=${expirationDate.toISOString()}`,
    );
    return subscription;
  }

  // ─── Access check ──────────────────────────────────────────────────────────

  /**
   * Returns whether a customer currently has access to the OTT service based
   * on their active subscription.
   *
   * ACTIVE        → access allowed
   * GRACE_PERIOD  → access allowed (grace window still open)
   * SUSPENDED     → access denied
   * No subscription → access denied
   */
  async checkAccess(customerId: string): Promise<SubscriptionAccess> {
    const sub = await this.getActiveSubscription(customerId);

    if (!sub) {
      return { hasAccess: false, status: null, subscription: null, reason: 'No active subscription' };
    }

    const now = new Date();

    if (sub.status === 'ACTIVE') {
      return { hasAccess: true, status: 'ACTIVE', subscription: sub };
    }

    if (sub.status === 'GRACE_PERIOD') {
      const gracePeriodEnd = sub.gracePeriodEnd;
      if (gracePeriodEnd && gracePeriodEnd > now) {
        return { hasAccess: true, status: 'GRACE_PERIOD', subscription: sub };
      }
      return { hasAccess: false, status: 'GRACE_PERIOD', subscription: sub, reason: 'Grace period expired' };
    }

    return {
      hasAccess: false,
      status: sub.status,
      subscription: sub,
      reason: 'Subscription suspended',
    };
  }

  // ─── Query helpers ─────────────────────────────────────────────────────────

  /** Returns the most recent non-cancelled subscription for a customer. */
  async getActiveSubscription(customerId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: {
        customerId,
        status: { not: 'CANCELLED' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { id } });
  }

  async listCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Payment event ─────────────────────────────────────────────────────────

  /**
   * Processes a confirmed payment against a subscription.
   * Renews the subscription from NOW, recalculates expiration and grace period,
   * resets notification flags, and restores ACTIVE status.
   *
   * This is the hook called by the payment gateway webhook or manual CMS action.
   */
  async processPayment(
    subscriptionId: string,
    dto: ProcessPaymentDto,
  ): Promise<{ subscription: Subscription; payment: Payment }> {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    if (sub.status === 'CANCELLED')
      throw new BadRequestException('Cannot renew a cancelled subscription');

    const plan = sub.plan;
    const startDate = new Date();
    const expirationDate = addDays(startDate, plan.duracionDias);
    const gracePeriodHours = plan.gracePeriodDays * 24;
    const gracePeriodEnd =
      gracePeriodHours > 0 ? addHours(expirationDate, gracePeriodHours) : null;

    const [updatedSub, payment] = await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          startDate,
          expirationDate,
          gracePeriodEnd,
          status: 'ACTIVE',
          reminderSent: false,
          expiredNotifSent: false,
          suspendedNotifSent: false,
        },
      }),
      this.prisma.payment.create({
        data: {
          customerId: sub.customerId,
          subscriptionId,
          amount: dto.amount,
          currency: dto.currency ?? 'USD',
          status: 'COMPLETED',
          externalRef: dto.externalRef ?? null,
          metadata: (dto.metadata as object) ?? null,
        },
      }),
    ]);

    this.logger.log(
      `Payment processed — subscription=${subscriptionId} amount=${dto.amount} ${dto.currency ?? 'USD'} newExpiry=${expirationDate.toISOString()}`,
    );
    return { subscription: updatedSub, payment };
  }

  // ─── Cancel ────────────────────────────────────────────────────────────────

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) throw new NotFoundException(`Subscription ${subscriptionId} not found`);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' },
    });
  }
}

// ─── Date helpers (no external deps) ─────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
