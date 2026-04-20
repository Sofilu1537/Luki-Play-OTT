-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
