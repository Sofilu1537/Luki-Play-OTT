-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'TRIAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'SOPORTE', 'CLIENTE');

-- CreateEnum
CREATE TYPE "SessionLimitPolicy" AS ENUM ('BLOCK_NEW', 'REPLACE_OLDEST');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "ispEmail" TEXT,
    "telefono" TEXT,
    "idNumber" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENTE',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "isCmsUser" BOOLEAN NOT NULL DEFAULT false,
    "isSubscriber" BOOLEAN NOT NULL DEFAULT true,
    "isAccountActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contractNumber" VARCHAR(20) NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'LUKI PLAY',
    "ispPlanName" TEXT,
    "maxDevices" INTEGER NOT NULL DEFAULT 2,
    "maxConcurrentStreams" INTEGER NOT NULL DEFAULT 1,
    "sessionDurationDays" INTEGER NOT NULL DEFAULT 30,
    "sessionLimitPolicy" "SessionLimitPolicy" NOT NULL DEFAULT 'BLOCK_NEW',
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewing_profiles" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "preferredLang" TEXT NOT NULL DEFAULT 'es',
    "parentalControlEnabled" BOOLEAN NOT NULL DEFAULT false,
    "parentalControlPin" TEXT,
    "contentPreferences" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'app',
    "refreshToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "deviceFingerprint" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'LUKI PLAY',
    "descripcion" TEXT NOT NULL DEFAULT 'Streaming incluido con tu servicio de internet Luki',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "maxDevices" INTEGER NOT NULL DEFAULT 2,
    "maxConcurrentStreams" INTEGER NOT NULL DEFAULT 1,
    "maxProfiles" INTEGER NOT NULL DEFAULT 3,
    "videoQuality" TEXT NOT NULL DEFAULT 'HD',
    "allowDownloads" BOOLEAN NOT NULL DEFAULT false,
    "allowCasting" BOOLEAN NOT NULL DEFAULT true,
    "hasAds" BOOLEAN NOT NULL DEFAULT true,
    "entitlements" JSONB NOT NULL DEFAULT '["live-tv", "vod-basic", "sports"]',
    "allowedComponentIds" JSONB NOT NULL DEFAULT '[]',
    "allowedCategoryIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "customersCreated" INTEGER NOT NULL DEFAULT 0,
    "contractsCreated" INTEGER NOT NULL DEFAULT 0,
    "contractsUpdated" INTEGER NOT NULL DEFAULT 0,
    "contractsSuspended" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_idNumber_key" ON "customers"("idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_customerId_idx" ON "contracts"("customerId");

-- CreateIndex
CREATE INDEX "viewing_profiles_contractId_idx" ON "viewing_profiles"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_contractId_idx" ON "sessions"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_deviceFingerprint_key" ON "devices"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "devices_contractId_idx" ON "devices"("contractId");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_profiles" ADD CONSTRAINT "viewing_profiles_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
