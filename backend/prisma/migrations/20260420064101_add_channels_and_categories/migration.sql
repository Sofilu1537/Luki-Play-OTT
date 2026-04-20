-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('ACTIVE', 'SCHEDULED', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StreamProtocol" AS ENUM ('HLS', 'DASH', 'HLS_DASH');

-- CreateEnum
CREATE TYPE "ChannelHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'OFFLINE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "icono" TEXT NOT NULL DEFAULT '',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "streamUrl" TEXT NOT NULL,
    "backupUrl" TEXT,
    "logoUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "epgSourceId" TEXT,
    "status" "ChannelStatus" NOT NULL DEFAULT 'ACTIVE',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "healthStatus" "ChannelHealthStatus" NOT NULL DEFAULT 'OFFLINE',
    "uptimePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastHealthCheckAt" TIMESTAMP(3),
    "streamProtocol" "StreamProtocol" NOT NULL DEFAULT 'HLS',
    "resolution" TEXT NOT NULL DEFAULT '1080p',
    "bitrateKbps" INTEGER NOT NULL DEFAULT 5000,
    "isDrmProtected" BOOLEAN NOT NULL DEFAULT false,
    "geoRestriction" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 99,
    "planIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiereControlParental" BOOLEAN NOT NULL DEFAULT false,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_nombre_key" ON "categories"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "channels_nombre_key" ON "channels"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "channels_slug_key" ON "channels"("slug");

-- CreateIndex
CREATE INDEX "channels_categoryId_idx" ON "channels"("categoryId");

-- CreateIndex
CREATE INDEX "channels_status_idx" ON "channels"("status");

-- CreateIndex
CREATE INDEX "channels_isLive_idx" ON "channels"("isLive");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
