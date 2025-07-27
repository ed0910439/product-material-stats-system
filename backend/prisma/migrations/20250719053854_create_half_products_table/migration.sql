/*
  Warnings:

  - You are about to drop the `HalfProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "meal_recipes" DROP CONSTRAINT "meal_recipes_half_product_id_fkey";

-- DropTable
DROP TABLE "HalfProduct";

-- CreateTable
CREATE TABLE "half_products" (
    "id" SERIAL NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT[],
    "classification" TEXT,
    "unit_quantity" DOUBLE PRECISION,
    "capacity_unit" TEXT,
    "packaging_unit" TEXT,
    "supplier" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "half_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "half_products_product_id_key" ON "half_products"("product_id");

-- AddForeignKey
ALTER TABLE "meal_recipes" ADD CONSTRAINT "meal_recipes_half_product_id_fkey" FOREIGN KEY ("half_product_id") REFERENCES "half_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
