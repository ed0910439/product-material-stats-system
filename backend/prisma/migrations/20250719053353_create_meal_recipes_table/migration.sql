/*
  Warnings:

  - You are about to drop the `MealRecipe` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MealRecipe" DROP CONSTRAINT "MealRecipe_half_product_id_fkey";

-- DropForeignKey
ALTER TABLE "MealRecipe" DROP CONSTRAINT "MealRecipe_meal_id_fkey";

-- DropTable
DROP TABLE "MealRecipe";

-- CreateTable
CREATE TABLE "meal_recipes" (
    "id" SERIAL NOT NULL,
    "meal_id" TEXT NOT NULL,
    "half_product_id" INTEGER NOT NULL,
    "required_quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meal_recipes_meal_id_half_product_id_key" ON "meal_recipes"("meal_id", "half_product_id");

-- AddForeignKey
ALTER TABLE "meal_recipes" ADD CONSTRAINT "meal_recipes_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_recipes" ADD CONSTRAINT "meal_recipes_half_product_id_fkey" FOREIGN KEY ("half_product_id") REFERENCES "HalfProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
