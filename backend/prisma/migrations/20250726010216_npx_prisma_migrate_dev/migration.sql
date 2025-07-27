/*
  Warnings:

  - You are about to drop the column `factor` on the `UnitConversion` table. All the data in the column will be lost.
  - You are about to drop the `half_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `raw_materials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recipe_items` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `rate` to the `UnitConversion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UnitConversion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "recipe_items" DROP CONSTRAINT "recipe_items_half_product_component_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_items" DROP CONSTRAINT "recipe_items_half_product_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_items" DROP CONSTRAINT "recipe_items_meal_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_items" DROP CONSTRAINT "recipe_items_raw_material_id_fkey";

-- AlterTable
ALTER TABLE "UnitConversion" DROP COLUMN "factor",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rate" DECIMAL(10,5) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "half_products";

-- DropTable
DROP TABLE "meals";

-- DropTable
DROP TABLE "raw_materials";

-- DropTable
DROP TABLE "recipe_items";

-- DropEnum
DROP TYPE "MealType";

-- DropEnum
DROP TYPE "ParentType";

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "meal_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HalfProduct" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "supplier" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "packaging_unit" TEXT NOT NULL,
    "capacity_value" DECIMAL(10,3) NOT NULL DEFAULT 0.0,
    "capacity_unit" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HalfProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterial" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT,
    "halfProductId" TEXT,
    "component_type" "ComponentType" NOT NULL,
    "raw_material_id" TEXT,
    "half_product_component_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySalesSummary" (
    "id" TEXT NOT NULL,
    "sale_date" DATE NOT NULL,
    "mealId" TEXT,
    "halfProductId" TEXT,
    "quantity_sold" DECIMAL(10,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySalesSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meal_product_id_key" ON "Meal"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_name_key" ON "Meal"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HalfProduct_product_id_key" ON "HalfProduct"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "HalfProduct_name_key" ON "HalfProduct"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterial_product_id_key" ON "RawMaterial"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterial_name_key" ON "RawMaterial"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeItem_mealId_raw_material_id_half_product_component_id_key" ON "RecipeItem"("mealId", "raw_material_id", "half_product_component_id");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeItem_halfProductId_raw_material_id_half_product_compo_key" ON "RecipeItem"("halfProductId", "raw_material_id", "half_product_component_id");

-- CreateIndex
CREATE INDEX "DailySalesSummary_sale_date_idx" ON "DailySalesSummary"("sale_date");

-- CreateIndex
CREATE INDEX "DailySalesSummary_mealId_idx" ON "DailySalesSummary"("mealId");

-- CreateIndex
CREATE INDEX "DailySalesSummary_halfProductId_idx" ON "DailySalesSummary"("halfProductId");

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_halfProductId_fkey" FOREIGN KEY ("halfProductId") REFERENCES "HalfProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_half_product_component_id_fkey" FOREIGN KEY ("half_product_component_id") REFERENCES "HalfProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySalesSummary" ADD CONSTRAINT "DailySalesSummary_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySalesSummary" ADD CONSTRAINT "DailySalesSummary_halfProductId_fkey" FOREIGN KEY ("halfProductId") REFERENCES "HalfProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
