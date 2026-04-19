-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_contractId_fkey";

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "contractId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
