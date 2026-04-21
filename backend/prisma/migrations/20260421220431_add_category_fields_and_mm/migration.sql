/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#FFB800',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "channel_categories" (
    "channelId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_categories_pkey" PRIMARY KEY ("channelId","categoryId")
);

-- CreateIndex
CREATE INDEX "channel_categories_channelId_idx" ON "channel_categories"("channelId");

-- CreateIndex
CREATE INDEX "channel_categories_categoryId_idx" ON "channel_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_activo_idx" ON "categories"("activo");

-- CreateIndex
CREATE INDEX "categories_displayOrder_idx" ON "categories"("displayOrder");

-- AddForeignKey
ALTER TABLE "channel_categories" ADD CONSTRAINT "channel_categories_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_categories" ADD CONSTRAINT "channel_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
