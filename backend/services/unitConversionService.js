// backend/services/unitConversionService.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getConversionFactor(fromUnit, toUnit) {
    if (fromUnit === toUnit) {
        return 1;
    }

    // 將單位標準化為小寫並去除空白，以便進行一致的比較和查詢
    const standardizedFromUnit = fromUnit.trim().toLowerCase();
    const standardizedToUnit = toUnit.trim().toLowerCase();

    // 嘗試從資料庫中查找直接的換算關係 (from -> to)
    let conversion = await prisma.unitConversion.findUnique({
        where: {
            from_unit_to_unit: { // 假設您的 Prisma Schema 中定義了複合唯一索引
                from_unit: standardizedFromUnit,
                to_unit: standardizedToUnit
            }
        }
    });

    if (conversion) {
        return conversion.factor;
    }

    // 嘗試查找反向的換算關係 (to -> from)
    let reverseConversion = await prisma.unitConversion.findUnique({
        where: {
            from_unit_to_unit: {
                from_unit: standardizedToUnit,
                to_unit: standardizedFromUnit
            }
        }
    });

    if (reverseConversion) {
        return 1 / reverseConversion.factor;
    }

    // 如果未找到任何直接或反向換算，拋出錯誤或返回默認值
    // 拋出錯誤是更好的選擇，因為這表示數據不完整或單位不匹配
    console.error(`Error: No conversion factor found for ${fromUnit} to ${toUnit}`);
    throw new Error(`無法在單位 ${fromUnit} 和 ${toUnit} 之間找到換算因子。請檢查單位換算數據庫。`);
}

module.exports = {
    getConversionFactor
};