// backend/controllers/mealsController.js
const { PrismaClient } = require('@prisma/client');
const recipeService = require('../services/recipeService'); // 引入 recipeService
const exceljs = require('exceljs');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const {
    MENU_CATEGORIES,
    ALL_MENU_CLASSIFICATIONS,
    MEAL_TYPES,
    // HALF_PRODUCT_CATEGORIES, // mealsController 不直接使用這些
    // HALF_PRODUCT_CLASSIFICATIONS,
    // HALF_PRODUCT_UNITS,
    // SUPPLIERS
} = require('../constants'); // 確保這些常量是最新的

// --- 下載餐點數據模板 ---
exports.downloadMealTemplate = async (req, res) => {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('餐點數據模板');

    worksheet.columns = [
        { header: '產品編號', key: 'product_id', width: 15 },
        { header: '餐點名稱', key: 'name', width: 20 },
        { header: '菜單類別', key: 'category', width: 15 }, // 修改為 category
        { header: '餐點分類', key: 'classification', width: 15 }, // 修改為 classification
        { header: '餐點類型', key: 'meal_type', width: 15 }, // 如果您的 meal model 沒有 meal_type，請移除或修改
        { header: '啟用狀態 (true/false)', key: 'is_active', width: 20 },
    ];

    worksheet.getCell('A1').note = '請輸入唯一的產品編號';

    worksheet.dataValidations.add('C2:C101', { // 菜單類別 (Category)
        type: 'list',
        allowBlank: true,
        formulae: [`"${MENU_CATEGORIES.join(',')}"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請從下拉選單中選擇一個有效的菜單類別。', promptTitle: '菜單類別', prompt: '請選擇菜單類別'
    });

    worksheet.dataValidations.add('D2:D101', { // 餐點分類 (Classification)
        type: 'list',
        allowBlank: true,
        formulae: [`"${ALL_MENU_CLASSIFICATIONS.join(',')}"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請從下拉選單中選擇一個有效的餐點分類。', promptTitle: '餐點分類', prompt: '請選擇餐點分類'
    });

    worksheet.dataValidations.add('E2:E101', { // 餐點類型 (如果您 model 有 meal_type)
        type: 'list',
        allowBlank: true,
        formulae: [`"${MEAL_TYPES.join(',')}"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請從下拉選單中選擇一個有效的餐點類型。', promptTitle: '餐點類型', prompt: '請選擇餐點類型'
    });

    worksheet.dataValidations.add('F2:F101', { // 啟用狀態
        type: 'list',
        allowBlank: true,
        formulae: [`"TRUE,FALSE"`], // 使用 TRUE/FALSE 而不是 true/false，Excel 會更好識別
        showErrorMessage: true, errorTitle: '無效輸入', error: '請輸入 TRUE 或 FALSE。', promptTitle: '啟用狀態', prompt: '請選擇啟用狀態'
    });

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + '餐點數據模板.xlsx'
    );

    try {
        await workbook.xlsx.write(res);
        res.end();
        console.log('餐點數據模板已成功下載。');
    } catch (error) {
        console.error("下載餐點模板時發生錯誤:", error);
        res.status(500).json({ message: "下載餐點模板失敗。", error: error.message });
    }
};


// --- 上傳餐點 Excel 數據 ---
exports.uploadMeals = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '沒有上傳文件。' });
    }

    const filePath = req.file.path;
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        for (const row of data) {
            try {
                const mealData = {
                    product_id: String(row['產品編號'] || '').trim(),
                    name: String(row['餐點名稱'] || '').trim(),
                    category: String(row['菜單類別'] || '').trim(),
                    classification: String(row['餐點分類'] || '').trim(),
                    meal_type: String(row['餐點類型'] || '').trim() || null, // 允許為空
                    is_active: String(row['啟用狀態 (true/false)'] || '').toLowerCase() === 'true',
                };

                // 驗證必要欄位
                if (!mealData.product_id || !mealData.name || !mealData.category || !mealData.classification) {
                    throw new Error('必要欄位缺失 (產品編號、餐點名稱、菜單類別、餐點分類)。');
                }
                // 驗證類別和分類是否在允許的範圍內
                if (!MENU_CATEGORIES.includes(mealData.category)) {
                    throw new Error(`無效的菜單類別: ${mealData.category}。`);
                }
                if (!ALL_MENU_CLASSIFICATIONS.includes(mealData.classification)) {
                    throw new Error(`無效的餐點分類: ${mealData.classification}。`);
                }
                if (mealData.meal_type && !MEAL_TYPES.includes(mealData.meal_type)) {
                    throw new Error(`無效的餐點類型: ${mealData.meal_type}。`);
                }


                await prisma.meal.upsert({
                    where: { product_id: mealData.product_id },
                    update: mealData,
                    create: mealData,
                });
                successCount++;

            } catch (innerError) {
                failCount++;
                errors.push({
                    row: row,
                    message: `處理餐點 "${row['餐點名稱'] || '未知名稱'}" (產品編號: ${row['產品編號'] || 'N/A'}) 失敗: ${innerError.message}`,
                    errorDetail: innerError.message
                });
                console.error(`處理餐點資料列時發生錯誤 (產品編號: ${row['產品編號'] || 'N/A'}):`, innerError.message);
            }
        }

        if (failCount > 0) {
            res.status(200).json({
                message: `餐點上傳完成。成功 ${successCount} 筆，失敗 ${failCount} 筆。`,
                successCount,
                failCount,
                errors,
            });
        } else {
            res.status(200).json({
                message: '所有餐點數據上傳成功！',
                successCount,
                failCount,
                errors: [],
            });
        }
        console.log(`餐點數據上傳結果：成功 ${successCount} 筆，失敗 ${failCount} 筆。`);

    } catch (outerError) {
        console.error("上傳或解析餐點 Excel 文件時發生錯誤:", outerError);
        if (!res.headersSent) {
            res.status(500).json({ message: `上傳文件或解析失敗: ${outerError.message}` });
        }
    } finally {
        // 清理上傳的暫存文件
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`已刪除暫存文件: ${filePath}`);
        }
    }
};

// --- 獲取所有餐點 (使用 Prisma) ---
exports.getAllMeals = async (req, res) => {
    try {
        const meals = await prisma.meal.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        res.json(meals);
        console.log('已獲取所有餐點列表。');
    } catch (err) {
        console.error('獲取餐點列表時發生錯誤:', err);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取餐點列表。', error: err.message });
    }
};

// --- 獲取單一餐點及其配方 (使用 Prisma) ---
exports.getMealById = async (req, res) => {
    const { id } = req.params;
    try {
        const meal = await prisma.meal.findUnique({
            where: {
                id: id
            },
            include: {
                recipesAsParent: {
                    include: {
                        raw_material: true,       // 確保這裡是 raw_material
                        halfProductComponent: true
                    },
                    orderBy: [
                        { component_type: "asc" }, // 先按類型排序
                        { raw_material: { name: "asc" } }, // 再按原物料名稱排序
                        { halfProductComponent: { name: "asc" } } // 最後按半成品名稱排序
                    ]
                }
            }
        });

        if (!meal) {
            console.warn(`未找到餐點 ID: ${id}`);
            return res.status(404).json({ message: '未找到該餐點。' });
        }
        res.json(meal);
        console.log(`已獲取餐點 ID: ${id} 的詳細資訊。`);
    } catch (error) {
        console.error(`獲取餐點 ID: ${id} 時發生錯誤:`, error);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取餐點資訊。', error: error.message });
    }
};

// --- 新增餐點 (使用 Prisma 並處理 recipeItems) ---
exports.createMeal = async (req, res) => {
    const { product_id, name, category, classification, meal_type, is_active, recipeItems } = req.body;

    try {
        const newMeal = await prisma.$transaction(async (tx) => {
            const createdMeal = await tx.meal.create({
                data: {
                    product_id,
                    name,
                    category,
                    classification,
                    meal_type,
                    is_active: is_active ?? true, // 如果 is_active 未提供，預設為 true
                },
            });

            // 處理配方數據
            if (recipeItems && recipeItems.length > 0) {
                await recipeService.manageRecipeItems(tx, createdMeal.id, 'MEAL', recipeItems);
            }
            return createdMeal;
        });

        res.status(201).json(newMeal);
        console.log(`已成功創建餐點: ${newMeal.name} (ID: ${newMeal.id})`);
    } catch (err) {
        console.error('創建餐點時發生錯誤:', err);
        if (err.code === 'P2002') { // 唯一約束衝突 (產品編號或餐點名稱重複)
            return res.status(409).json({ message: '創建失敗：產品編號或餐點名稱已存在。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法創建餐點。', error: err.message });
    }
};

// --- 更新餐點 (使用 Prisma 並處理 recipeItems) ---
exports.updateMeal = async (req, res) => {
    const { id } = req.params;
    const { product_id, name, category, classification, meal_type, is_active, recipeItems } = req.body;

    try {
        const updatedMeal = await prisma.$transaction(async (tx) => {
            const meal = await tx.meal.update({
                where: { id: id },
                data: {
                    product_id,
                    name,
                    category,
                    classification,
                    meal_type,
                    is_active,
                },
            });
            // 處理配方數據 (即使 recipeItems 為空陣列，也會清空舊配方)
            await recipeService.manageRecipeItems(tx, id, 'MEAL', recipeItems);

            return meal;
        });

        res.json(updatedMeal);
        console.log(`已成功更新餐點 ID: ${id} (${updatedMeal.name})`);
    } catch (err) {
        console.error(`更新餐點 ID: ${id} 時發生錯誤:`, err);
        if (err.code === 'P2025') { // 未找到要更新的記錄
            return res.status(404).json({ message: '更新失敗：找不到此餐點。' });
        }
        if (err.code === 'P2002') { // 唯一約束衝突
            return res.status(409).json({ message: '更新失敗：產品編號或餐點名稱已存在。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法更新餐點。', error: err.message });
    }
};

// --- 刪除餐點 (使用 Prisma 並處理相關 RecipeItem) ---
exports.deleteMeal = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.$transaction(async (tx) => {
            // 先刪除所有與此餐點相關的 RecipeItem
            await tx.recipeItem.deleteMany({
                where: { mealId: id },
            });
            await tx.meal.delete({
                where: { id: id },
            });
        });
        res.status(204).send(); // No Content
        console.log(`已成功刪除餐點 ID: ${id} 及其所有相關配方。`);
    } catch (err) {
        console.error(`刪除餐點 ID: ${id} 時發生錯誤:`, err);
        if (err.code === 'P2025') { // 未找到要刪除的記錄
            return res.status(404).json({ message: '刪除失敗：找不到此餐點。' });
        }
        // 如果有其他外鍵約束錯誤 (例如，餐點已被銷售記錄引用)，Prisma 會拋出 P2003
        if (err.code === 'P2003') {
            return res.status(409).json({ message: '刪除失敗：此餐點已有相關銷售記錄或其他引用，請先刪除相關數據。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法刪除餐點。', error: err.message });
    }
};

// 新增：計算單一餐點所需的底層原物料總量 (統一使用 recipeService)
exports.getMealRawMaterialUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, unit } = req.query; // 期望計算多少份的餐點

        if (!quantity || !unit) {
            console.warn('餐點食材用量計算：缺少必要的 quantity 或 unit 參數。');
            return res.status(400).json({ message: '用量計算需要提供數量和單位。' });
        }

        const parsedQuantity = parseFloat(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            console.warn(`餐點食材用量計算：無效的數量 '${quantity}'。`);
            return res.status(400).json({ message: '提供的數量無效，必須是正數。' });
        }

        // 統一使用 recipeService 進行計算
        const usageMap = await recipeService.calculateTotalIngredientUsage(id, 'MEAL', parsedQuantity, unit);

        // 將 Map 轉換為前端友好的 Array 格式
        const usageArray = Array.from(usageMap.values());
        res.status(200).json(usageArray);
        console.log(`已成功計算餐點 ID: ${id} 總用量。`);
    } catch (error) {
        console.error(`計算餐點 ID: ${id} 用量時發生錯誤:`, error);
        res.status(500).json({ message: '計算餐點用量失敗。', error: error.message });
    }
};

// 獲取各分區銷量最好的前五樣餐點 (這部分依舊使用模擬數據，需要根據實際銷售數據模型來實現)
exports.getTopFiveMealsByRegion = async (req, res) => {
    try {
        // **重要：這部分需要您根據實際的銷售數據來源來實現。**
        // 如果您的銷售數據存在資料庫中 (例如 DailySalesSummary 表)，
        // 您可以使用 Prisma 進行更精確的查詢和聚合。
        // 以下是一個示意性的查詢範例，假設有 DailySalesSummary 表：

        /*
        const topMeals = await prisma.dailySalesSummary.groupBy({
            by: ['mealId'],
            _sum: {
                quantitySold: true,
            },
            orderBy: {
                _sum: {
                    quantitySold: 'desc'
                }
            },
            take: 20, // 先取多一些，以便在 JS 中按 category 分組
        });

        const mealIds = topMeals.map(item => item.mealId);
        const mealsDetails = await prisma.meal.findMany({
            where: { id: { in: mealIds } },
            select: { id: true, name: true, category: true }
        });

        const categorizedSales = {};
        mealsDetails.forEach(meal => {
            const salesItem = topMeals.find(item => item.mealId === meal.id);
            if (salesItem) {
                if (!categorizedSales[meal.category]) {
                    categorizedSales[meal.category] = [];
                }
                categorizedSales[meal.category].push({
                    id: meal.id,
                    name: meal.name,
                    category: meal.category,
                    sales: salesItem._sum.quantitySold.toNumber() // 轉換為數字
                });
            }
        });

        const topFiveByRegion = {};
        MENU_CATEGORIES.forEach(cat => {
            if (categorizedSales[cat]) {
                const sorted = categorizedSales[cat].sort((a, b) => b.sales - a.sales);
                topFiveByRegion[cat] = sorted.slice(0, 5);
            } else {
                topFiveByRegion[cat] = [];
            }
        });

        res.status(200).json(topFiveByRegion);
        */

        // 目前仍使用模擬數據，請替換為真實數據來源！
        const salesData = [
            { category: '牛區', name: '紅燒牛肉麵', sales: 150 },
            { category: '牛區', name: '辣味牛肉麵', sales: 120 },
            { category: '風味區', name: '乾拌麵', sales: 180 },
            { category: '風味區', name: '私房小食', sales: 90 },
            { category: '炒飯區', name: '蝦仁炒飯', sales: 160 },
            { category: '炒飯區', name: '牛肉炒飯', sales: 110 },
            { category: '菜滷飲', name: '滷大腸', sales: 100 },
            { category: '菜滷飲', name: '冬瓜茶', sales: 70 },
            { category: '牛區', name: '原味牛肉麵', sales: 110 },
            { category: '風味區', name: '湯品-風', sales: 80 },
            { category: '炒飯區', name: '豬肉炒飯', sales: 95 },
            { category: '菜滷飲', name: '涼拌小黃瓜', sales: 60 },
        ];

        const topFiveByRegion = {};

        MENU_CATEGORIES.forEach(cat => {
            const filtered = salesData.filter(d => d.category === cat);
            const sorted = filtered.sort((a, b) => b.sales - a.sales);
            topFiveByRegion[cat] = sorted.slice(0, 5);
        });

        res.status(200).json(topFiveByRegion);
        console.log('已獲取各分區銷量最好的前五樣餐點報告 (目前為模擬數據)。');
    } catch (error) {
        console.error('獲取各分區銷量最好的前五樣餐點時發生錯誤:', error);
        res.status(500).json({ message: '獲取銷售報告失敗。', error: error.message });
    }
};