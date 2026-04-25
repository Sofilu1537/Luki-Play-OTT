import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EMAIL_SERVICE } from '../../auth/domain/interfaces/email.service';
import type { EmailService } from '../../auth/domain/interfaces/email.service';

/**
 * SubscriptionNotificationWorker
 *
 * Runs every hour and advances the subscription lifecycle:
 *
 *  1. REMINDER      — ACTIVE subs expiring within 3 days, reminderSent=false
 *  2. EXPIRE        — ACTIVE subs past expirationDate:
 *                       grace > 0  → GRACE_PERIOD
 *                       grace = 0  → SUSPENDED (revoke access immediately)
 *  3. EXPIRED NOTIF — GRACE_PERIOD subs where (expirationDate + 24h) ≤ NOW
 *                       and expiredNotifSent=false
 *  4. SUSPEND       — GRACE_PERIOD subs where gracePeriodEnd ≤ NOW → SUSPENDED
 *
 * All queries use targeted compound indexes — no full-table scans.
 * Each step is fault-tolerant: a single failed email never aborts the batch.
 */
@Injectable()
export class SubscriptionNotificationWorker {
  private readonly logger = new Logger(SubscriptionNotificationWorker.name);

  /** How many days before expiration to send the first reminder. */
  private static readonly REMINDER_DAYS_BEFORE = 3;

  /** How many hours after expiration to send the "subscription expired" email. */
  private static readonly EXPIRED_NOTIF_HOURS_AFTER = 24;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMAIL_SERVICE) private readonly email: EmailService,
  ) {}

  // ─── Main cron — every hour at minute 7 ──────────────────────────────────

  @Cron('7 * * * *')
  async runCycle(): Promise<void> {
    this.logger.log('Subscription lifecycle cycle starting…');
    const now = new Date();

    await Promise.allSettled([
      this.sendReminders(now),
      this.expireActiveSubscriptions(now),
      this.sendExpiredNotifications(now),
      this.suspendGracePeriodSubscriptions(now),
    ]);

    this.logger.log('Subscription lifecycle cycle complete.');
  }

  // ─── Step 1: Reminders ────────────────────────────────────────────────────

  private async sendReminders(now: Date): Promise<void> {
    const windowEnd = addDays(now, SubscriptionNotificationWorker.REMINDER_DAYS_BEFORE);

    const subs = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        reminderSent: false,
        expirationDate: { lte: windowEnd, gt: now },
      },
      include: { customer: true },
    });

    if (subs.length === 0) return;
    this.logger.log(`Sending ${subs.length} subscription reminder(s)…`);

    for (const sub of subs) {
      try {
        const customer = sub.customer;
        if (customer.email) {
          await this.email.sendSubscriptionReminder(
            customer.email,
            customer.nombre,
            sub.expirationDate,
          );
        }
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { reminderSent: true },
        });
        await this.logNotification(sub.customerId, 'SUBSCRIPTION_REMINDER');
      } catch (err) {
        this.logger.error(`Reminder failed for subscription ${sub.id}: ${(err as Error).message}`);
      }
    }
  }

  // ─── Step 2: Expire ACTIVE → GRACE_PERIOD or SUSPENDED ───────────────────

  private async expireActiveSubscriptions(now: Date): Promise<void> {
    const subs = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: { lte: now },
      },
      include: { customer: true },
    });

    if (subs.length === 0) return;
    this.logger.log(`Expiring ${subs.length} active subscription(s)…`);

    for (const sub of subs) {
      try {
        const hasGrace = sub.gracePeriodEnd !== null;
        const newStatus = hasGrace ? 'GRACE_PERIOD' : 'SUSPENDED';

        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: newStatus },
        });

        if (!hasGrace) {
          // Immediate suspension: revoke active sessions
          await this.revokeCustomerSessions(sub.customerId);

          const customer = sub.customer;
          if (customer.email) {
            await this.email.sendSubscriptionSuspended(
              customer.email,
              customer.nombre,
            );
          }
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { suspendedNotifSent: true },
          });
          await this.logNotification(sub.customerId, 'SUBSCRIPTION_SUSPENDED');
        }

        this.logger.log(`Subscription ${sub.id} → ${newStatus}`);
      } catch (err) {
        this.logger.error(`Expire failed for subscription ${sub.id}: ${(err as Error).message}`);
      }
    }
  }

  // ─── Step 3: Expired notification (24h after expiry, while in grace) ─────

  private async sendExpiredNotifications(now: Date): Promise<void> {
    const notifThreshold = addHours(
      now,
      -SubscriptionNotificationWorker.EXPIRED_NOTIF_HOURS_AFTER,
    );

    const subs = await this.prisma.subscription.findMany({
      where: {
        status: 'GRACE_PERIOD',
        expiredNotifSent: false,
        expirationDate: { lte: notifThreshold },
      },
      include: { customer: true },
    });

    if (subs.length === 0) return;
    this.logger.log(`Sending ${subs.length} expired notification(s)…`);

    for (const sub of subs) {
      try {
        const customer = sub.customer;
        if (customer.email) {
          await this.email.sendSubscriptionExpired(
            customer.email,
            customer.nombre,
            sub.gracePeriodEnd ?? sub.expirationDate,
          );
        }
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { expiredNotifSent: true },
        });
        await this.logNotification(sub.customerId, 'SUBSCRIPTION_EXPIRED');
      } catch (err) {
        this.logger.error(`Expired notif failed for subscription ${sub.id}: ${(err as Error).message}`);
      }
    }
  }

  // ─── Step 4: Suspend after grace period ───────────────────────────────────

  private async suspendGracePeriodSubscriptions(now: Date): Promise<void> {
    const subs = await this.prisma.subscription.findMany({
      where: {
        status: 'GRACE_PERIOD',
        gracePeriodEnd: { lte: now },
      },
      include: { customer: true },
    });

    if (subs.length === 0) return;
    this.logger.log(`Suspending ${subs.length} subscription(s) after grace period…`);

    for (const sub of subs) {
      try {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'SUSPENDED',
            suspendedNotifSent: true,
          },
        });

        await this.revokeCustomerSessions(sub.customerId);

        const customer = sub.customer;
        if (customer.email && !sub.suspendedNotifSent) {
          await this.email.sendSubscriptionSuspended(
            customer.email,
            customer.nombre,
          );
        }
        await this.logNotification(sub.customerId, 'SUBSCRIPTION_SUSPENDED');

        this.logger.log(`Subscription ${sub.id} → SUSPENDED (grace expired)`);
      } catch (err) {
        this.logger.error(`Suspend failed for subscription ${sub.id}: ${(err as Error).message}`);
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Revokes all active app sessions for a customer to force re-auth. */
  private async revokeCustomerSessions(customerId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        customerId,
        audience: 'app',
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
  }

  private async logNotification(
    customerId: string,
    type: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        customerId,
        type: type as any,
        status: 'SENT',
      },
    });
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
