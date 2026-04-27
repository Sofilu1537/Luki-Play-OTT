-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "channel_favorites" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL DEFAULT '__default__',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channel_favorites_customerId_deviceId_profileId_idx" ON "channel_favorites"("customerId", "deviceId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_favorites_customerId_channelId_deviceId_profileId_key" ON "channel_favorites"("customerId", "channelId", "deviceId", "profileId");

-- AddForeignKey
ALTER TABLE "channel_favorites" ADD CONSTRAINT "channel_favorites_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_favorites" ADD CONSTRAINT "channel_favorites_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
