// backend/controllers/reportController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const recipeService = require('../services/recipeService'); // 引入配方服務

// --- 上傳營業匯總表 Excel 數據 ---
exports.uploadSalesSummary = async (req, res) => {
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
                const saleDate = row['銷售日期'] ? new Date(row['銷售日期']) : null; // 假設 Excel 日期格式可被 Date 解析
                const productId = String(row['產品編號'] || '').trim(); // 產品編號可能是餐點或半成品
                const quantitySold = new prisma.Decimal(row['銷售數量']); // 確保是 Decimal

                if (!saleDate || isNaN(saleDate.getTime()) || !productId || quantitySold.lessThanOrEqualTo(0)) {
                    throw new Error('必要欄位缺失或格式無效 (銷售日期、產品編號、銷售數量)。');
                }

                // 檢查產品編號是餐點還是半成品
                let meal = await prisma.meal.findUnique({ where: { product_id: productId }, select: { id: true } });
                let halfProduct = null;
                if (!meal) {
                    halfProduct = await prisma.halfProduct.findUnique({ where: { product_id: productId }, select: { id: true } });
                }

                if (!meal && !halfProduct) {
                    throw new Error(`找不到對應產品編號 "${productId}" 的餐點或半成品。`);
                }

                // 儲存到 DailySalesSummary
                await prisma.dailySalesSummary.create({
                    data: {
                        saleDate: saleDate,
                        mealId: meal ? meal.id : null,
                        halfProductId: halfProduct ? halfProduct.id : null,
                        quantitySold: quantitySold,
                    }
                });
                successCount++;

            } catch (innerError) {
                failCount++;
                errors.push({
                    row: row,
                    message: `處理銷售記錄 (產品編號: ${row['產品編號'] || 'N/A'}) 失敗: ${innerError.message}`,
                    errorDetail: innerError.message
                });
                console.error(`處理銷售記錄資料列時發生錯誤 (產品編號: ${row['產品編號'] || 'N/A'}):`, innerError.message);
            }
        }

        if (failCount > 0) {
            res.status(200).json({
                message: `營業匯總表上傳完成。成功 ${successCount} 筆，失敗 ${failCount} 筆。`,
                successCount,
                failCount,
                errors,
            });
        } else {
            res.status(200).json({
                message: '所有營業匯總表數據上傳成功！',
                successCount,
                failCount,
                errors: [],
            });
        }
        console.log(`營業匯總表上傳結果：成功 ${successCount} 筆，失敗 ${failCount} 筆。`);

    } catch (outerError) {
        console.error("上傳或解析營業匯總表 Excel 文件時發生錯誤:", outerError);
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


// --- 獲取指定日期範圍內的原物料使用量彙總報告 ---
exports.getMaterialUsageSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // 從查詢參數獲取日期範圍

        if (!startDate || !endDate) {
            return res.status(400).json({ message: '請提供開始日期和結束日期。' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // 確保包含結束日期的所有時間

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            return res.status(400).json({ message: '日期格式無效或日期範圍不正確。' });
        }

        console.log(`正在計算從 ${start.toISOString()} 到 ${end.toISOString()} 的原物料使用報告...`);

        // 1. 從 DailySalesSummary 獲取指定日期範圍內的銷售總量
        const salesRecords = await prisma.dailySalesSummary.findMany({
            where: {
                saleDate: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                mealId: true,
                halfProductId: true,
                quantitySold: true,
            },
        });

        if (salesRecords.length === 0) {
            console.log('指定日期範圍內沒有銷售記錄。');
            return res.status(200).json({
                message: '指定日期範圍內沒有銷售記錄。',
                totalMaterialUsage: [],
                reportPeriod: { startDate, endDate }
            });
        }

        // 使用 Map 來聚合所有底層原材料的總用量
        let aggregatedMaterials = new Map(); // key: rawMaterial.id, value: { name, quantity, unit, type }

        for (const record of salesRecords) {
            const soldQuantity = record.quantitySold.toNumber(); // 銷售數量
            let parentId;
            let parentType;

            if (record.mealId) {
                parentId = record.mealId;
                parentType = 'MEAL';
            } else if (record.halfProductId) {
                parentId = record.halfProductId;
                parentType = 'HALF_PRODUCT';
            } else {
                continue; // 跳過沒有 mealId 或 halfProductId 的記錄
            }

            // 調用 recipeService 獲取該產品的底層原材料用量
            // 這裡假設 calculateTotalIngredientUsage 返回的單位是其自身的"基礎單位"
            const productUsageMap = await recipeService.calculateTotalIngredientUsage(
                parentId,
                parentType,
                soldQuantity,
                '份' // 這裡的單位可以是一個通用單位，或者根據產品類型來定
            );

            // 將產品的用量聚合到總的 aggregatedMaterials 中
            for (const [materialId, usage] of productUsageMap.entries()) {
                if (aggregatedMaterials.has(materialId)) {
                    aggregatedMaterials.get(materialId).quantity += usage.quantity;
                } else {
                    aggregatedMaterials.set(materialId, { ...usage });
                }
            }
        }

        // 將 Map 轉換為陣列，以便於前端顯示
        const totalMaterialUsage = Array.from(aggregatedMaterials.values());

        // 可選：對結果進行排序 (例如按名稱或總量)
        totalMaterialUsage.sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json({
            message: '原物料使用量彙總報告已成功生成。',
            totalMaterialUsage: totalMaterialUsage,
            reportPeriod: { startDate, endDate }
        });
        console.log('原物料使用量彙總報告已生成。');

    } catch (error) {
        console.error('生成原物料使用量彙總報告時發生錯誤:', error);
        res.status(500).json({ message: '生成原物料使用量彙總報告失敗。', error: error.message });
    }
};


// 獲取各分區銷量最好的前五樣餐點 (這個會使用 DailySalesSummary 表)
exports.getTop5SalesByCategories = async (req, res) => {
    try {
        // 從 DailySalesSummary 聚合每個餐點的總銷售數量
        const salesByMeal = await prisma.dailySalesSummary.groupBy({
            by: ['mealId'],
            _sum: {
                quantitySold: true,
            },
            having: {
                mealId: {
                    not: null // 只計算餐點的銷售
                }
            }
        });

        // 獲取所有相關餐點的詳細信息
        const mealIds = salesByMeal.map(item => item.mealId);
        const mealsDetails = await prisma.meal.findMany({
            where: {
                id: {
                    in: mealIds
                }
            },
            select: {
                id: true,
                name: true,
                category: true // 需要 category 字段
            }
        });

        // 將銷售數據與餐點詳細信息結合
        const combinedSales = salesByMeal.map(sales => {
            const meal = mealsDetails.find(m => m.id === sales.mealId);
            return {
                id: sales.mealId,
                name: meal ? meal.name : '未知餐點',
                category: meal ? meal.category : '其他',
                totalQuantitySold: sales._sum.quantitySold.toNumber()
            };
        });

        // 按類別分組並排序取前五
        const top5ByCategories = {};
        const categories = [...new Set(mealsDetails.map(m => m.category))]; // 獲取所有獨特的類別

        categories.forEach(cat => {
            const filteredAndSorted = combinedSales
                .filter(item => item.category === cat)
                .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
                .slice(0, 5);
            top5ByCategories[cat] = filteredAndSorted;
        });

        res.status(200).json(top5ByCategories);
        console.log('已獲取各分區銷量最好的前五樣餐點報告。');

    } catch (error) {
        console.error('獲取 Top 5 銷售報告時發生錯誤:', error);
        res.status(500).json({ message: '獲取 Top 5 銷售報告失敗。', error: error.message });
    }
};