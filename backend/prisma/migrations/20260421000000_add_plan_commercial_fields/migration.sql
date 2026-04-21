-- AlterTable: Add commercial, timing and channel access fields to plans
ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "grupoUsuarios"       TEXT    NOT NULL DEFAULT 'ISP_BUNDLE',
  ADD COLUMN IF NOT EXISTS "precio"              DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "moneda"              TEXT    NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "duracionDias"        INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "trialDays"           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "gracePeriodDays"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "allowedChannelIds"   JSONB   NOT NULL DEFAULT '[]';

-- Update defaults that changed (maxDevices 2→3, maxConcurrentStreams 1→2)
-- Only affects existing rows that still have the old default; new rows get the new default automatically.
UPDATE "plans" SET "maxDevices" = 3 WHERE "maxDevices" = 2;
UPDATE "plans" SET "maxConcurrentStreams" = 2 WHERE "maxConcurrentStreams" = 1;
