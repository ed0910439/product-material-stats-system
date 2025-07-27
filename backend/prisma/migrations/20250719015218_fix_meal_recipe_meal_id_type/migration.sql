/*
  Warnings:

  - You are about to drop the `Meal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MealRecipe" DROP CONSTRAINT "MealRecipe_meal_id_fkey";

-- DropIndex
DROP INDEX "HalfProduct_name_key";

-- AlterTable
ALTER TABLE "MealRecipe" ALTER COLUMN "meal_id" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Meal";

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "menu_category" TEXT NOT NULL,
    "menu_classification" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meals_product_id_key" ON "meals"("product_id");

-- AddForeignKey
ALTER TABLE "MealRecipe" ADD CONSTRAINT "MealRecipe_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
