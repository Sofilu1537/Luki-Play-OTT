-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'SMART_TV', 'UNKNOWN');

-- Drop old devices table constraints and indexes
DROP INDEX IF EXISTS "devices_deviceFingerprint_key";
DROP INDEX IF EXISTS "devices_contractId_idx";

-- Alter devices table: make contractId optional, add new columns, rename old ones
ALTER TABLE "devices"
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "nombre" TEXT,
  ADD COLUMN "tipo" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "os" TEXT,
  ADD COLUMN "browser" TEXT,
  ADD COLUMN "modelo" TEXT,
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Copy existing data: deviceName → nombre, lastUsedAt → lastSeenAt, createdAt → registeredAt
UPDATE "devices" SET
  "nombre" = "deviceName",
  "lastSeenAt" = "lastUsedAt",
  "registeredAt" = "createdAt";

-- Make contractId optional
ALTER TABLE "devices" ALTER COLUMN "contractId" DROP NOT NULL;

-- Backfill customerId from contract if possible
UPDATE "devices" d
SET "customerId" = c."customerId"
FROM "contracts" c
WHERE d."contractId" = c."id";

-- Remove rows where customerId could not be resolved (orphaned devices)
DELETE FROM "devices" WHERE "customerId" IS NULL;

-- Now make customerId NOT NULL
ALTER TABLE "devices" ALTER COLUMN "customerId" SET NOT NULL;

-- Drop old columns
ALTER TABLE "devices"
  DROP COLUMN "deviceName",
  DROP COLUMN "deviceType",
  DROP COLUMN "lastUsedAt",
  DROP COLUMN "createdAt";

-- Add new unique constraint and indexes
CREATE UNIQUE INDEX "devices_customerId_deviceFingerprint_key" ON "devices"("customerId", "deviceFingerprint");
CREATE INDEX "devices_customerId_idx" ON "devices"("customerId");
CREATE INDEX "devices_contractId_idx" ON "devices"("contractId");

-- Add foreign key for customerId
ALTER TABLE "devices" ADD CONSTRAINT "devices_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
