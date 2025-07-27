-- CreateTable
CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "menu_category" TEXT NOT NULL,
    "menu_classification" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HalfProduct" (
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

    CONSTRAINT "HalfProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealRecipe" (
    "id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "half_product_id" INTEGER NOT NULL,
    "required_quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitConversion" (
    "id" SERIAL NOT NULL,
    "from_unit" TEXT NOT NULL,
    "to_unit" TEXT NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitConversion_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "MealRecipe_meal_id_half_product_id_key" ON "MealRecipe"("meal_id", "half_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "UnitConversion_from_unit_to_unit_key" ON "UnitConversion"("from_unit", "to_unit");

-- AddForeignKey
ALTER TABLE "MealRecipe" ADD CONSTRAINT "MealRecipe_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealRecipe" ADD CONSTRAINT "MealRecipe_half_product_id_fkey" FOREIGN KEY ("half_product_id") REFERENCES "HalfProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
