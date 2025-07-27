/*
  Warnings:

  - The primary key for the `half_products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `half_products` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `half_products` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `half_products` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `half_products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `classification` on the `half_products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `unit_quantity` on the `half_products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,3)`.
  - You are about to alter the column `capacity_unit` on the `half_products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `packaging_unit` on the `half_products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `supplier` on the `half_products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The primary key for the `meals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `meal_type` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `menu_category` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `menu_classification` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `meals` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `meals` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the `meal_recipes` table. If the table is not empty, all the data it contains will be lost.
  - The required column `half_product_id` was added to the `half_products` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `half_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `meals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classification` to the `meals` table without a default value. This is not possible if the table is not empty.
  - The required column `meal_id` was added to the `meals` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `meals` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ParentType" AS ENUM ('MEAL', 'HALF_PRODUCT');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('RAW_MATERIAL', 'HALF_PRODUCT');

-- DropForeignKey
ALTER TABLE "meal_recipes" DROP CONSTRAINT "meal_recipes_half_product_id_fkey";

-- DropForeignKey
ALTER TABLE "meal_recipes" DROP CONSTRAINT "meal_recipes_meal_id_fkey";

-- AlterTable
ALTER TABLE "half_products" DROP CONSTRAINT "half_products_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "half_product_id" TEXT NOT NULL,
ADD COLUMN     "is_sellable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "classification" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "unit_quantity" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "capacity_unit" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "packaging_unit" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "supplier" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "half_products_pkey" PRIMARY KEY ("half_product_id");

-- AlterTable
ALTER TABLE "meals" DROP CONSTRAINT "meals_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "meal_type",
DROP COLUMN "menu_category",
DROP COLUMN "menu_classification",
DROP COLUMN "updated_at",
ADD COLUMN     "category" VARCHAR(255) NOT NULL,
ADD COLUMN     "classification" VARCHAR(255) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "meal_id" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("meal_id");

-- DropTable
DROP TABLE "meal_recipes";

-- CreateTable
CREATE TABLE "raw_materials" (
    "raw_material_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "current_stock" DECIMAL(10,3) NOT NULL,
    "min_stock_level" DECIMAL(10,3) NOT NULL,
    "supplier" VARCHAR(255),
    "purchase_price" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("raw_material_id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "recipe_item_id" TEXT NOT NULL,
    "parent_type" "ParentType" NOT NULL,
    "meal_id" TEXT,
    "half_product_parent_id" TEXT,
    "component_type" "ComponentType" NOT NULL,
    "raw_material_id" TEXT,
    "half_product_component_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("recipe_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_product_id_key" ON "raw_materials"("product_id");

-- CreateIndex
CREATE INDEX "recipe_items_meal_id_idx" ON "recipe_items"("meal_id");

-- CreateIndex
CREATE INDEX "recipe_items_half_product_parent_id_idx" ON "recipe_items"("half_product_parent_id");

-- CreateIndex
CREATE INDEX "recipe_items_raw_material_id_idx" ON "recipe_items"("raw_material_id");

-- CreateIndex
CREATE INDEX "recipe_items_half_product_component_id_idx" ON "recipe_items"("half_product_component_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_meal_id_raw_material_id_key" ON "recipe_items"("meal_id", "raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_meal_id_half_product_component_id_key" ON "recipe_items"("meal_id", "half_product_component_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_half_product_parent_id_raw_material_id_key" ON "recipe_items"("half_product_parent_id", "raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_half_product_parent_id_half_product_component__key" ON "recipe_items"("half_product_parent_id", "half_product_component_id");

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("meal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_half_product_parent_id_fkey" FOREIGN KEY ("half_product_parent_id") REFERENCES "half_products"("half_product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("raw_material_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_half_product_component_id_fkey" FOREIGN KEY ("half_product_component_id") REFERENCES "half_products"("half_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
