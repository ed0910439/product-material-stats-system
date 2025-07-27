// backend/services/recipeService.js (配方服務，處理食材計算和單位轉換)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 標準化單位：僅處理公斤、公克、公升、毫升
const BASE_UNITS = {
    WEIGHT: '克',   // 所有重量單位最終轉換為克
    VOLUME: '毫升'  // 所有體積單位最終轉換為毫升
};

// 單位類型映射 (用於判斷單位屬於哪一類，以便找到對應的基礎單位)
const UNIT_TYPES = {
    '公斤': 'WEIGHT', '克': 'WEIGHT', 'g': 'WEIGHT', 'kg': 'WEIGHT', // 考慮到輸入可能包含英文縮寫
    '公升': 'VOLUME', '毫升': 'VOLUME', 'ml': 'VOLUME', 'L': 'VOLUME', // 考慮到輸入可能包含英文縮寫
    // 這裡不再包含 '個', '包', '箱', '份', '碗', '杯' 等，因為它們不是通用的計量單位。
    // 如果 RecipeItem 或 HalfProduct 仍使用這些，它們將被視為獨立單位，不進行 kg/g/L/ml 轉換。
};

/**
 * 將數量從一個標準計量單位轉換為另一個標準計量單位。
 * 僅支援公斤、公克、公升、毫升之間的換算。
 *
 * @param {import('@prisma/client').Prisma.Decimal} quantity - 待轉換的數量 (Prisma Decimal 類型)。
 * @param {string} fromUnit - 原始單位 (e.g., '公斤', '毫升')。
 * @param {string} toUnit - 目標單位 (e.g., '克', '公升')。
 * @returns {Promise<number>} 轉換後的數量 (返回為 JS Number)。
 */
async function convertUnits(quantity, fromUnit, toUnit) {
    if (fromUnit === toUnit) {
        return quantity.toNumber();
    }

    const fromType = UNIT_TYPES[fromUnit];
    const toType = UNIT_TYPES[toUnit];

    // 檢查單位是否為支援的計量單位，並且屬於同一類型
    if (!fromType || !toType || fromType !== toType) {
        console.warn(`單位轉換警告：不支援從 '${fromUnit}' 轉換到 '${toUnit}'。單位類型不匹配或非標準計量單位。`);
        // 如果單位不是標準計量單位，或者類型不匹配，則直接返回原始數量。
        // 這意味著 '包' 到 '克' 的轉換將不會通過這裡。
        return quantity.toNumber();
    }

    try {
        // 優先嘗試直接轉換
        let conversion = await prisma.unitConversion.findUnique({
            where: {
                from_unit_to_unit: { // 使用複合唯一鍵
                    from_unit: fromUnit,
                    to_unit: toUnit
                }
            }
        });

        if (conversion) {
            return quantity.times(conversion.rate).toNumber();
        }

        // 如果沒有直接轉換，嘗試透過基礎單位進行兩階段轉換
        const baseUnit = BASE_UNITS[fromType]; // 獲取該單位類型的基礎單位

        // 從 fromUnit 轉到基礎單位
        const convToPrimary = await prisma.unitConversion.findUnique({
            where: {
                from_unit_to_unit: {
                    from_unit: fromUnit,
                    to_unit: baseUnit
                }
            }
        });

        // 從基礎單位轉到 toUnit
        const convFromPrimary = await prisma.unitConversion.findUnique({
            where: {
                from_unit_to_unit: {
                    from_unit: baseUnit,
                    to_unit: toUnit
                }
            }
        });

        if (convToPrimary && convFromPrimary) {
            // quantity * (fromUnit -> baseUnit)Rate * (baseUnit -> toUnit)Rate
            const quantityInBase = quantity.times(convToPrimary.rate);
            return quantityInBase.times(convFromPrimary.rate).toNumber();
        }

        console.error(`單位轉換失敗: 找不到從 ${fromUnit} 到 ${toUnit} 的有效轉換路徑。請檢查 UnitConversion 表。`);
        throw new Error(`找不到從 ${fromUnit} 到 ${toUnit} 的單位轉換率。`);

    } catch (error) {
        console.error(`執行單位轉換時發生錯誤 (${fromUnit} -> ${toUnit}):`, error.message);
        throw error;
    }
}


/**
 * 遞歸計算指定父實體 (餐點或半成品) 所需的所有底層原材料 (含半成品) 總量。
 *
 * @param {string} parentId - 餐點或半成品的 ID。
 * @param {'MEAL' | 'HALF_PRODUCT'} parentType - 父實體的類型。
 * @param {number} requestedQuantity - 請求的父實體數量 (JS Number)。
 * @param {string} requestedUnit - 請求的父實體單位 (例如 '份', '個', '包')。此參數將主要用於 top-level 的轉換判斷。
 * @returns {Promise<Map<string, { id: string, name: string, quantity: number, unit: string, type: 'RAW_MATERIAL' | 'HALF_PRODUCT' }>>} 聚合後的原材料映射。
 */
exports.calculateTotalIngredientUsage = async (parentId, parentType, requestedQuantity, requestedUnit) => {
    let totalIngredientsMap = new Map();

    /**
     * 獲取指定父實體的配方項目。
     * @param {string} id - 父實體ID。
     * @param {'MEAL' | 'HALF_PRODUCT'} type - 父實體類型。
     * @returns {Promise<Array>} 配方項目列表。
     */
    const fetchRecipes = async (id, type) => {
        let parentItem;
        try {
            if (type === 'MEAL') {
                parentItem = await prisma.meal.findUnique({
                    where: { id: id },
                    include: {
                        recipesAsParent: {
                            include: {
                                raw_material: true,
                                halfProductComponent: true,
                            },
                        },
                    },
                });
            } else if (type === 'HALF_PRODUCT') {
                parentItem = await prisma.halfProduct.findUnique({
                    where: { id: id },
                    include: {
                        recipesAsParent: {
                            include: {
                                raw_material: true,
                                halfProductComponent: true,
                            },
                        },
                    },
                });
            }
            if (!parentItem) {
                console.warn(`警告：未找到 ${type} ID: ${id}。`);
                return [];
            }
            return parentItem.recipesAsParent;
        } catch (error) {
            console.error(`獲取 ${type} ID: ${id} 的配方時發生錯誤:`, error);
            throw error;
        }
    };

    /**
     * 遞歸處理配方組件並聚合原材料。
     * @param {Object} componentRecipeItem - 當前的配方項目 (RecipeItem)。
     * @param {number} currentMultiplier - 從頂層到當前組件的總乘數。
     */
    const processComponent = async (componentRecipeItem, currentMultiplier) => {
        if (!componentRecipeItem) return;

        const recipeItemQuantityDecimal = componentRecipeItem.quantity; // RecipeItem 中的數量 (Prisma Decimal)
        const recipeItemUnit = componentRecipeItem.unit; // RecipeItem 中的單位

        const totalComponentNeededDecimal = recipeItemQuantityDecimal.times(currentMultiplier);

        if (componentRecipeItem.component_type === 'RAW_MATERIAL' && componentRecipeItem.raw_material) {
            const rawMaterial = componentRecipeItem.raw_material;
            const rawMaterialUnit = rawMaterial.unit;

            let finalQuantity;
            try {
                // 嘗試將其轉換為原物料自身的單位
                finalQuantity = await convertUnits(
                    totalComponentNeededDecimal,
                    recipeItemUnit,
                    rawMaterialUnit
                );
            } catch (e) {
                // 如果單位無法轉換 (例如 '包' 到 '克' 沒有定義)，則保留原始數量和單位
                console.warn(`原物料 [${rawMaterial.name}] 用量轉換失敗 (從 ${recipeItemUnit} 到 ${rawMaterialUnit})，將保留為 ${recipeItemUnit}。錯誤: ${e.message}`);
                finalQuantity = totalComponentNeededDecimal.toNumber();
                // 這裡將 unit 設置為 recipeItemUnit，因為沒有轉換成功
                // 如果你要求最終報告只顯示 '克'/'毫升'，則這個 '包'/'個' 的數量將會保留
                // 如果你需要將 '包' 這種非計量單位最終也轉換為 '克' 或 '毫升'，那麼這個轉換邏輯需要額外定義在 RawMaterial 或 HalfProduct 模型中。
                rawMaterial.unit = recipeItemUnit; // 強制將報告單位設為配方單位
            }


            const key = rawMaterial.id; // 以原物料ID作為唯一鍵
            if (totalIngredientsMap.has(key)) {
                totalIngredientsMap.get(key).quantity += finalQuantity;
            } else {
                totalIngredientsMap.set(key, {
                    id: rawMaterial.id,
                    name: rawMaterial.name,
                    quantity: finalQuantity,
                    unit: rawMaterial.unit, // 使用原物料自身的單位作為聚合單位 (或經過fallback的單位)
                    type: 'RAW_MATERIAL'
                });
            }

        } else if (componentRecipeItem.component_type === 'HALF_PRODUCT' && componentRecipeItem.halfProductComponent) {
            const halfProduct = componentRecipeItem.halfProductComponent;
            const halfProductCapacityUnit = halfProduct.capacity_unit; // 半成品自身的容量單位 (e.g., '克', '毫升', '份', '包')
            const halfProductCapacityValue = halfProduct.capacity_value; // 每包裝單位實際的容量值 (e.g., 500 for 500克/包)

            // 計算半成品在當前層次的總需求量 (以 recipeItemUnit 為單位)
            // 這個 `requiredHalfProductQuantity` 仍然是 Decimal 類型
            const requiredHalfProductQuantity = totalComponentNeededDecimal;

            // 遞歸調用自身處理半成品組件的配方
            // 關鍵點在於計算傳遞給下一層遞歸的 `multiplierForSubComponents`
            let multiplierForSubComponents;

            try {
                // 1. 將 `requiredHalfProductQuantity` 從 `recipeItemUnit` 轉換為 `halfProductCapacityUnit`
                // 這裡會用到 `convertUnits`，如果 `halfProductCapacityUnit` 是非標準計量單位，會直接返回原始數量。
                const quantityInHalfProductCapacityUnit = await convertUnits(
                    requiredHalfProductQuantity,
                    recipeItemUnit,
                    halfProductCapacityUnit
                );

                // 2. 將其除以 `halfProductCapacityValue`，因為半成品內部的配方是基於其 `capacity_value` 定義的。
                // 例子: 如果一個半成品 RecipeItem 需要 2 '包'，而半成品定義為 1 '包' = 500 '克' (capacity_value=500, capacity_unit='克')
                // 那麼我們需要總共 2 * currentMultiplier '包' 的半成品。
                // 轉換成克數是 (2 * currentMultiplier * 500) '克'。
                // 遞歸到半成品內部時，它的配方是每 '克' 所需的。
                // 所以傳遞給下一層的乘數應該是 (總克數)。
                // 如果 halfProductCapacityValue 為 0，需要避免除以零
                if (halfProductCapacityValue.isZero()) {
                    console.warn(`半成品 [${halfProduct.name}] 的容量值為零，無法計算其內部組件用量。`);
                    multiplierForSubComponents = 0;
                } else {
                    multiplierForSubComponents = quantityInHalfProductCapacityUnit / halfProductCapacityValue.toNumber();
                }

            } catch (e) {
                console.error(`計算半成品 [${halfProduct.name}] 內部乘數時發生單位轉換錯誤: ${e.message}`);
                // 如果單位轉換失敗，可能需要根據業務邏輯決定如何處理，這裡是停止遞歸。
                multiplierForSubComponents = 0;
            }


            const subRecipes = await fetchRecipes(halfProduct.id, 'HALF_PRODUCT');
            for (const subRecipeItem of subRecipes) {
                await processComponent(subRecipeItem, multiplierForSubComponents);
            }

        } else {
            console.warn(`警告：不明組件類型或數據缺失在配方項目 ID: ${componentRecipeItem?.id || '未知'}`);
        }
    };

    // 開始處理主餐點或半成品的最頂層配方
    const mainRecipes = await fetchRecipes(parentId, parentType);
    if (!mainRecipes.length) {
        console.warn(`找不到 ${parentType} ID: ${parentId} 的配方，或其配方為空。`);
        return totalIngredientsMap; // 返回空 Map
    }

    // 這裡的 `requestedQuantity` 是前端請求的 `大份量`，直接作為頂層乘數
    for (const recipeItem of mainRecipes) {
        await processComponent(recipeItem, requestedQuantity);
    }

    // 將 Map 轉換為陣列，並在最後統一處理計量單位的標準化
    const finalResultArray = await Promise.all(
        Array.from(totalIngredientsMap.values()).map(async (item) => {
            const unitType = UNIT_TYPES[item.unit];
            if (unitType === 'WEIGHT' && item.unit !== BASE_UNITS.WEIGHT) {
                item.quantity = await convertUnits(prisma.Decimal(item.quantity), item.unit, BASE_UNITS.WEIGHT);
                item.unit = BASE_UNITS.WEIGHT;
            } else if (unitType === 'VOLUME' && item.unit !== BASE_UNITS.VOLUME) {
                item.quantity = await convertUnits(prisma.Decimal(item.quantity), item.unit, BASE_UNITS.VOLUME);
                item.unit = BASE_UNITS.VOLUME;
            }
            // 對於非計量單位 (如 '包', '個', '份')，它們將保持原樣
            return item;
        })
    );

    // 返回 Map 格式，ID 作為鍵
    return new Map(finalResultArray.map(item => [item.id, item]));
};


/**
 * 管理 (新增/更新/刪除) 餐點或半成品的配方項目。
 * @param {object} tx - Prisma 事務實例。
 * @param {string} parentId - 餐點或半成品的 ID。
 * @param {'MEAL' | 'HALF_PRODUCT'} parentType - 父實體的類型。
 * @param {Array<Object>} newRecipeItems - 新的配方項目陣列。
 */
exports.manageRecipeItems = async (tx, parentId, parentType, newRecipeItems) => {
    // 獲取現有的配方項目
    let existingRecipeItems;
    if (parentType === 'MEAL') {
        existingRecipeItems = await tx.recipeItem.findMany({ where: { mealId: parentId } });
    } else { // HALF_PRODUCT
        existingRecipeItems = await tx.recipeItem.findMany({ where: { halfProductId: parentId } });
    }

    const existingMap = new Map(existingRecipeItems.map(item => {
        const key = item.component_type === 'RAW_MATERIAL'
            ? `RM_${item.raw_material_id}`
            : `HP_${item.half_product_component_id}`;
        return [key, item];
    }));

    // 處理新增和更新
    for (const newItem of newRecipeItems) {
        const itemKey = newItem.component_type === 'RAW_MATERIAL'
            ? `RM_${newItem.raw_material_id}`
            : `HP_${newItem.half_product_component_id}`;

        const dataToCreateUpdate = {
            quantity: new tx.Decimal(newItem.quantity),
            unit: newItem.unit,
            component_type: newItem.component_type,
            raw_material_id: newItem.component_type === 'RAW_MATERIAL' ? newItem.id : null,
            half_product_component_id: newItem.component_type === 'HALF_PRODUCT' ? newItem.id : null,
            ...(parentType === 'MEAL' ? { mealId: parentId } : { halfProductId: parentId })
        };

        if (existingMap.has(itemKey)) {
            // 更新現有項目
            await tx.recipeItem.update({
                where: { id: existingMap.get(itemKey).id },
                data: dataToCreateUpdate,
            });
            existingMap.delete(itemKey); // 從 map 中移除，剩餘的將被刪除
        } else {
            // 創建新項目
            await tx.recipeItem.create({
                data: dataToCreateUpdate,
            });
        }
    }

    // 處理刪除 (existingMap 中剩餘的項目需要被刪除)
    const itemsToDelete = Array.from(existingMap.values());
    if (itemsToDelete.length > 0) {
        await tx.recipeItem.deleteMany({
            where: {
                id: { in: itemsToDelete.map(item => item.id) }
            }
        });
    }
};