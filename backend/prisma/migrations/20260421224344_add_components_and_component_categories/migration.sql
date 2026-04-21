-- CreateTable
CREATE TABLE "components" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "icono" TEXT NOT NULL DEFAULT '',
    "tipo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 99,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_categories" (
    "componentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_categories_pkey" PRIMARY KEY ("componentId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "components_nombre_key" ON "components"("nombre");

-- CreateIndex
CREATE INDEX "components_activo_idx" ON "components"("activo");

-- CreateIndex
CREATE INDEX "components_orden_idx" ON "components"("orden");

-- CreateIndex
CREATE INDEX "component_categories_componentId_idx" ON "component_categories"("componentId");

-- CreateIndex
CREATE INDEX "component_categories_categoryId_idx" ON "component_categories"("categoryId");

-- AddForeignKey
ALTER TABLE "component_categories" ADD CONSTRAINT "component_categories_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_categories" ADD CONSTRAINT "component_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
