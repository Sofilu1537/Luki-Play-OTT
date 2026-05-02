-- Add parental control fields to customers table
ALTER TABLE "customers"
  ADD COLUMN "parentalControlEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "parentalControlPin" TEXT;
