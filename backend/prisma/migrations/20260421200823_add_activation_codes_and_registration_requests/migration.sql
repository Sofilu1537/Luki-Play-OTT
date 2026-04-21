-- CreateEnum
CREATE TYPE "RegistrationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "planId" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "maxDevices" SET DEFAULT 3,
ALTER COLUMN "maxConcurrentStreams" SET DEFAULT 2;

-- CreateTable
CREATE TABLE "activation_codes" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "generatedBy" TEXT,
    "sentToEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_requests" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "status" "RegistrationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activation_codes_code_idx" ON "activation_codes"("code");

-- CreateIndex
CREATE INDEX "activation_codes_customerId_idx" ON "activation_codes"("customerId");

-- CreateIndex
CREATE INDEX "registration_requests_status_idx" ON "registration_requests"("status");

-- CreateIndex
CREATE INDEX "registration_requests_idNumber_idx" ON "registration_requests"("idNumber");

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
