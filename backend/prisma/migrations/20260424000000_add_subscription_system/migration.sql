-- Migration: add_subscription_system
-- Adds Subscription, Payment, Notification tables and their supporting enums.

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'ACTIVE',
  'GRACE_PERIOD',
  'SUSPENDED',
  'CANCELLED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "NotificationType" AS ENUM (
  'SUBSCRIPTION_REMINDER',
  'SUBSCRIPTION_EXPIRED',
  'SUBSCRIPTION_SUSPENDED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED'
);

-- ─── subscriptions ────────────────────────────────────────────────────────────

CREATE TABLE "subscriptions" (
  "id"                 TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "customerId"         TEXT         NOT NULL,
  "planId"             TEXT         NOT NULL,
  "startDate"          TIMESTAMP(3) NOT NULL,
  "expirationDate"     TIMESTAMP(3) NOT NULL,
  "gracePeriodEnd"     TIMESTAMP(3),
  "status"             "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "reminderSent"       BOOLEAN      NOT NULL DEFAULT false,
  "expiredNotifSent"   BOOLEAN      NOT NULL DEFAULT false,
  "suspendedNotifSent" BOOLEAN      NOT NULL DEFAULT false,
  "planSnapshot"       JSONB        NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "subscriptions_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "subscriptions_customerId_idx"           ON "subscriptions"("customerId");
CREATE INDEX "subscriptions_status_expirationDate_idx" ON "subscriptions"("status", "expirationDate");
CREATE INDEX "subscriptions_status_gracePeriodEnd_idx" ON "subscriptions"("status", "gracePeriodEnd");

-- ─── payments ─────────────────────────────────────────────────────────────────

CREATE TABLE "payments" (
  "id"             TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "customerId"     TEXT         NOT NULL,
  "subscriptionId" TEXT         NOT NULL,
  "amount"         DOUBLE PRECISION NOT NULL,
  "currency"       TEXT         NOT NULL DEFAULT 'USD',
  "status"         "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "externalRef"    TEXT,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payments_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "payments_customerId_idx"     ON "payments"("customerId");
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- ─── notifications ────────────────────────────────────────────────────────────

CREATE TABLE "notifications" (
  "id"         TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
  "customerId" TEXT             NOT NULL,
  "type"       "NotificationType" NOT NULL,
  "channel"    TEXT             NOT NULL DEFAULT 'email',
  "sentAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status"     TEXT             NOT NULL DEFAULT 'SENT',
  "metadata"   JSONB,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "notifications_customerId_type_idx" ON "notifications"("customerId", "type");
