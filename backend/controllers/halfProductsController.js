// backend/controllers/halfProductsController.js
const { PrismaClient, Prisma } = require('@prisma/client');
const recipeService = require('../services/recipeService');
const exceljs = require('exceljs');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const {
    HALF_PRODUCT_CATEGORIES,
    HALF_PRODUCT_PACKAGING_UNITS,
    HALF_PRODUCT_CAPACITY_UNITS,
    COMMON_UNITS // 引入所有單位用於上傳時的單位驗證
} = require('../constants');


// --- 下載半成品數據模板 ---
exports.downloadHalfProductTemplate = async (req, res) => {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('半成品數據模板');

    // 根據用戶提供的CSV標題調整模板列定義
    worksheet.columns = [
        { header: '產品編號', key: 'product_id', width: 15 },
        { header: '半成品名稱', key: 'name', width: 20 },
        { header: '半成品簡稱', key: 'short_name', width: 15 }, // 新增
        { header: '供貨商', key: 'supplier', width: 15 },       // 新增
        { header: '分類', key: 'categories', width: 30 },      // 匹配CSV標題
        { header: '包裝數量', key: 'capacity_value', width: 15 }, // 匹配CSV標題
        { header: '包裝單位', key: 'packaging_unit', width: 15 }, // 匹配CSV標題
        { header: '容量單位', key: 'capacity_unit', width: 15 }, // 匹配CSV標題
        { header: '啟用狀態 (true/false)', key: 'is_active', width: 20 },
        { header: '虛擬半成品 (true/false)', key: 'is_virtual', width: 20 }, // 新增
    ];

    // 添加提示和數據驗證
    worksheet.getCell('A1').note = '請輸入唯一的產品編號';
    worksheet.getCell('E1').note = `半成品類別可多選，請用逗號分隔。可用值: ${HALF_PRODUCT_CATEGORIES.join(', ')}`;

    // 包裝單位 (CSV中的'包裝單位')
    worksheet.dataValidations.add('G2:G101', {
        type: 'list',
        allowBlank: true,
        formulae: [`"${HALF_PRODUCT_PACKAGING_UNITS.join(',')}"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請從下拉選單中選擇一個有效的包裝單位。', promptTitle: '包裝單位', prompt: '請選擇包裝單位'
    });
    // 容量單位 (CSV中的'容量單位')
    worksheet.dataValidations.add('H2:H101', {
        type: 'list',
        allowBlank: true,
        formulae: [`"${HALF_PRODUCT_CAPACITY_UNITS.join(',')}"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請從下拉選單中選擇一個有效的容量單位。', promptTitle: '容量單位', prompt: '請選擇容量單位'
    });
    // 啟用狀態
    worksheet.dataValidations.add('I2:I101', {
        type: 'list',
        allowBlank: true,
        formulae: [`"TRUE,FALSE"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請輸入 TRUE 或 FALSE。', promptTitle: '啟用狀態', prompt: '請選擇啟用狀態'
    });
    // 虛擬半成品
    worksheet.dataValidations.add('J2:J101', { // 新增虛擬半成品驗證
        type: 'list',
        allowBlank: true,
        formulae: [`"TRUE,FALSE"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請輸入 TRUE 或 FALSE。', promptTitle: '虛擬半成品', prompt: '請選擇虛擬半成品狀態'
    });


    const filename = encodeURIComponent('半成品數據模板.xlsx');
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);


    try {
        await workbook.xlsx.write(res);
        res.end();
        console.log('半成品數據模板已成功下載。');
    } catch (error) {
        console.error("下載半成品模板時發生錯誤:", error);
        res.status(500).json({ message: "下載半成品模板失敗。", error: error.message });
    }


};


// --- 上傳半成品 Excel 數據 ---
exports.uploadHalfProducts = async (req, res) => {
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
        // 確保 header 是第一行，並且 raw: true 以獲取原始值（避免數字轉換問題）
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

        // 提取標題行 (假設第一行是標題)
        const headers = data[0];
        // 實際數據從第二行開始
        const actualData = data.slice(1);

        for (let i = 0; i < actualData.length; i++) {
            const rowArr = actualData[i];
            // 將陣列形式的 row 轉換為物件形式，以便通過標題訪問
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = rowArr[index];
            });

            try {
                const categoriesString = String(row['分類'] || '').trim(); // 匹配CSV標題
                const categoriesArray = categoriesString
                    .split(',')
                    .map(cat => cat.trim())
                    .filter(cat => cat !== ''); // 過濾空字串

                // 驗證 categoriesArray 中的每個分類是否都有效
                const invalidCategories = categoriesArray.filter(cat => !HALF_PRODUCT_CATEGORIES.includes(cat));
                if (invalidCategories.length > 0) {
                    throw new Error(`無效的半成品類別: ${invalidCategories.join(', ')}。`);
                }

                const halfProductData = {
                    product_id: String(row['產品編號'] || '').trim(),
                    name: String(row['半成品名稱'] || '').trim(),
                    short_name: String(row['半成品簡稱'] || '').trim() || null, // 新增，允許為null
                    supplier: String(row['供貨商'] || '').trim() || null,     // 新增，允許為null
                    categories: categoriesArray, // 直接儲存陣列
                    packaging_unit: String(row['包裝單位'] || '').trim(),       // 匹配CSV標題
                    capacity_value: new Prisma.Decimal(row['包裝數量'].toString()),      // 匹配CSV標題
                    capacity_unit: String(row['容量單位'] || '').trim(),       // 匹配CSV標題
                    is_active: String(row['啟用狀態 (true/false)'] || '').toLowerCase() === 'true',
                    is_virtual: String(row['虛擬半成品'] || '').toLowerCase() === 'true', // 新增
                };

                // 驗證必要欄位 (根據您的需求，'short_name' 和 'supplier' 是可選的)
                if (!halfProductData.product_id || !halfProductData.name || !halfProductData.packaging_unit ||
                    halfProductData.capacity_value === undefined || halfProductData.capacity_value === null ||
                    !halfProductData.capacity_unit) {
                    throw new Error('必要欄位缺失 (產品編號、半成品名稱、包裝單位、包裝數量、容量單位)。');
                }

                // 驗證單位是否在允許範圍內
                if (!COMMON_UNITS.includes(halfProductData.packaging_unit) || !COMMON_UNITS.includes(halfProductData.capacity_unit)) {
                    throw new Error(`包裝單位或容量單位無效。請使用 ${COMMON_UNITS.join(', ')} 中的單位。`);
                }

                await prisma.halfProduct.upsert({
                    where: { product_id: halfProductData.product_id },
                    update: halfProductData,
                    create: halfProductData,
                });
                successCount++;

            } catch (innerError) {
                failCount++;
                errors.push({
                    row: row, // 包含完整的行數據
                    message: `處理半成品 "${row['半成品名稱'] || '未知名稱'}" (產品編號: ${row['產品編號'] || 'N/A'}) 失敗: ${innerError.message}`,
                    errorDetail: innerError.message
                });
                console.error(`處理半成品資料列時發生錯誤 (產品編號: ${row['產品編號'] || 'N/A'}, 行號: ${i + 2}):`, innerError.message); // 行號從2開始
            }
        }

        if (failCount > 0) {
            res.status(200).json({
                message: `半成品上傳完成。成功 ${successCount} 筆，失敗 ${failCount} 筆。`,
                successCount,
                failCount,
                errors,
            });
        } else {
            res.status(200).json({
                message: '所有半成品數據上傳成功！',
                successCount,
                failCount,
                errors: [],
            });
        }
        console.log(`半成品數據上傳結果：成功 ${successCount} 筆，失敗 ${failCount} 筆。`);

    } catch (outerError) {
        console.error("上傳或解析半成品 Excel 文件時發生錯誤:", outerError);
        if (!res.headersSent) {
            res.status(500).json({ message: `上傳文件或解析失敗: ${outerError.message}` });
        }
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`已刪除暫存文件: ${filePath}`);
        }
    }
};

// --- 獲取所有半成品 (使用 Prisma) ---
exports.getAllHalfProducts = async (req, res) => {
    try {
        const halfProducts = await prisma.halfProduct.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        res.json(halfProducts);
        console.log('已獲取所有半成品列表。');
    } catch (err) {
        console.error('獲取半成品列表時發生錯誤:', err);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取半成品列表。', error: err.message });
    }
};

// --- 獲取單一半成品及其配方 (使用 Prisma) ---
exports.getHalfProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const halfProduct = await prisma.halfProduct.findUnique({
            where: {
                id: id
            },
            include: {
                recipesAsParent: {
                    include: {
                        raw_material: true,
                        halfProductComponent: true
                    },
                    orderBy: [
                        { component_type: "asc" },
                        { raw_material: { name: "asc" } },
                        { halfProductComponent: { name: "asc" } }
                    ]
                }
            }
        });

        if (!halfProduct) {
            console.warn(`未找到半成品 ID: ${id}`);
            return res.status(404).json({ message: '未找到該半成品。' });
        }
        res.json(halfProduct);
        console.log(`已獲取半成品 ID: ${id} 的詳細資訊。`);
    } catch (error) {
        console.error(`獲取半成品 ID: ${id} 時發生錯誤:`, error);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取半成品資訊。', error: error.message });
    }
};

// --- 新增半成品 (使用 Prisma 並處理 recipeItems) ---
exports.createHalfProduct = async (req, res) => {
    const {
        product_id,
        name,
        short_name, // 新增
        supplier,   // 新增
        categories,
        packaging_unit,
        capacity_value,
        capacity_unit,
        is_active,
        is_virtual, // 新增
        recipeItems
    } = req.body;

    try {
        const newHalfProduct = await prisma.$transaction(async (tx) => {
            const createdHalfProduct = await tx.halfProduct.create({
                data: {
                    product_id,
                    name,
                    short_name: short_name || null, // 允許為null
                    supplier: supplier || null,     // 允許為null
                    categories, // 直接儲存陣列
                    packaging_unit,
                    capacity_value: new Prisma.Decimal(capacity_value.toString()), // 確保為 Decimal
                    capacity_unit,
                    is_active: is_active ?? true,
                    is_virtual: is_virtual ?? false, // 新增，預設為 false
                },
            });

            // 如果不是虛擬半成品，則處理配方數據
            if (!createdHalfProduct.is_virtual && recipeItems && recipeItems.length > 0) {
                await recipeService.manageRecipeItems(tx, createdHalfProduct.id, 'HALF_PRODUCT', recipeItems);
            }
            return createdHalfProduct;
        });

        res.status(201).json(newHalfProduct);
        console.log(`已成功創建半成品: ${newHalfProduct.name} (ID: ${newHalfProduct.id})`);
    } catch (err) {
        console.error('創建半成品時發生錯誤:', err);
        if (err.code === 'P2002') {
            return res.status(409).json({ message: '創建失敗：產品編號或半成品名稱已存在。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法創建半成品。', error: err.message });
    }
};

// --- 更新半成品 (使用 Prisma 並處理 recipeItems) ---
exports.updateHalfProduct = async (req, res) => {
    const { id } = req.params;
    const {
        product_id,
        name,
        short_name,
        supplier,
        categories,
        packaging_unit,
        capacity_value,
        capacity_unit,
        is_active,
        is_virtual,
        recipeItems
    } = req.body;

    // 在這裡加入驗證
    const recipes = Array.isArray(recipeItems) ? recipeItems : [];

    try {
        const result = await prisma.$transaction(async (tx) => {
            const halfProduct = await tx.halfProduct.update({
                where: { id },
                data: {
                    product_id,
                    name,
                    short_name,
                    supplier,
                    categories,
                    packaging_unit,
                    capacity_value: new Prisma.Decimal(capacity_value.toString()),
                    capacity_unit,
                    is_active,
                    is_virtual: is_virtual ?? false, // 確保這裡有傳遞給 Prisma
                },
            });
            
            // 處理配方
            if (!halfProduct.is_virtual) {
                await recipeService.manageRecipeItems(tx, id, 'HALF_PRODUCT', recipes);
            }
            return halfProduct;
        });
        res.json(result);
    } catch (err) {
        console.error('更新半成品錯誤:', err);
        res.status(500).json({ message: '內部伺服器錯誤，無法更新半成品。', error: err.message });
    }
};

// --- 刪除半成品 (使用 Prisma 並處理相關 RecipeItem) ---
exports.deleteHalfProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.$transaction(async (tx) => {
            // 先刪除所有與此半成品作為父級相關的 RecipeItem
            await tx.recipeItem.deleteMany({
                where: { halfProductId: id },
            });
            // 再刪除所有與此半成品作為組件相關的 RecipeItem
            await tx.recipeItem.deleteMany({
                where: { half_product_component_id: id },
            });
            await tx.halfProduct.delete({
                where: { id: id },
            });
        });
        res.status(204).send(); // No Content
        console.log(`已成功刪除半成品 ID: ${id} 及其所有相關配方。`);
    } catch (err) {
        console.error(`刪除半成品 ID: ${id} 時發生錯誤:`, err);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: '刪除失敗：找不到此半成品。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法刪除半成品。', error: err.message });
    }
};


// 新增：計算單一半成品所需的底層原物料總量 (統一使用 recipeService)
exports.getHalfProductRawMaterialUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, unit } = req.query; // 期望計算多少份的半成品

        if (!quantity || !unit) {
            console.warn('半成品食材用量計算：缺少必要的 quantity 或 unit 參數。');
            return res.status(400).json({ message: '用量計算需要提供數量和單位。' });
        }

        const parsedQuantity = parseFloat(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            console.warn(`半成品食材用量計算：無效的數量 '${quantity}'。`);
            return res.status(400).json({ message: '提供的數量無效，必須是正數。' });
        }

        // 統一使用 recipeService 進行計算
        const usageMap = await recipeService.calculateTotalIngredientUsage(id, 'HALF_PRODUCT', parsedQuantity, unit);

        // 將 Map 轉換為前端友好的 Array 格式
        const usageArray = Array.from(usageMap.values());
        res.status(200).json(usageArray);
        console.log(`已成功計算半成品 ID: ${id} 總用量。`);
    } catch (error) {
        console.error(`計算半成品 ID: ${id} 用量時發生錯誤:`, error);
        res.status(500).json({ message: '計算半成品用量失敗。', error: error.message });
    }
};