/*
  Warnings:

  - The primary key for the `UnitConversion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `UnitConversion` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `UnitConversion` table. All the data in the column will be lost.
  - Added the required column `meal_type` to the `meals` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('餐點', '附加選項用', '包材');

-- AlterTable
ALTER TABLE "UnitConversion" DROP CONSTRAINT "UnitConversion_pkey",
DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "factor" SET DEFAULT 1.0,
ADD CONSTRAINT "UnitConversion_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UnitConversion_id_seq";

-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "meal_type" "MealType" NOT NULL;
