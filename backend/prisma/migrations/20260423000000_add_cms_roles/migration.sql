-- CreateTable
CREATE TABLE "cms_roles" (
    "id" TEXT NOT NULL,
    "key" "UserRole" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_roles_key_key" ON "cms_roles"("key");

-- AlterTable: Remove per-user permissions column (now managed at role level)
ALTER TABLE "customers" DROP COLUMN IF EXISTS "permissions";

-- Seed default role permissions
INSERT INTO "cms_roles" ("id", "key", "permissions", "updatedAt") VALUES
  (gen_random_uuid(), 'SUPERADMIN', ARRAY[
    'cms:*',
    'cms:users:read', 'cms:users:write',
    'cms:content:read', 'cms:content:write',
    'cms:analytics:read', 'cms:settings:read', 'cms:settings:write',
    'app:playback', 'app:profiles'
  ]::TEXT[], NOW()),
  (gen_random_uuid(), 'ADMIN',   ARRAY[]::TEXT[], NOW()),
  (gen_random_uuid(), 'SOPORTE', ARRAY[]::TEXT[], NOW()),
  (gen_random_uuid(), 'CLIENTE', ARRAY[
    'app:playback', 'app:profiles'
  ]::TEXT[], NOW());
