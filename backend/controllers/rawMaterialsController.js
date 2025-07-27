// backend/controllers/rawMaterialsController.js
const { PrismaClient } = require('@prisma/client');
const exceljs = require('exceljs');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const { RAW_MATERIAL_UNITS } = require('../constants'); // 引入原物料單位

// --- 下載原物料數據模板 ---
exports.downloadRawMaterialTemplate = async (req, res) => {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('原物料數據模板');

    worksheet.columns = [
        { header: '產品編號', key: 'product_id', width: 15 },
        { header: '原物料名稱', key: 'name', width: 20 },
        { header: '單位', key: 'unit', width: 10 },
        { header: '啟用狀態 (true/false)', key: 'is_active', width: 20 },
    ];

    worksheet.getCell('A1').note = '請輸入唯一的產品編號';

    worksheet.dataValidations.add('C2:C101', { // 單位
        type: 'list',
        allowBlank: true,
        formulae: [`"${RAW_MATERIAL_UNITS.join(',')}"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請從下拉選單中選擇一個有效的單位。', promptTitle: '單位', prompt: '請選擇單位'
    });

    worksheet.dataValidations.add('D2:D101', { // 啟用狀態
        type: 'list',
        allowBlank: true,
        formulae: [`"TRUE,FALSE"`],
        showErrorMessage: true, errorTitle: '無效輸入', error: '請輸入 TRUE 或 FALSE。', promptTitle: '啟用狀態', prompt: '請選擇啟用狀態'
    });

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + '原物料數據模板.xlsx'
    );

    try {
        await workbook.xlsx.write(res);
        res.end();
        console.log('原物料數據模板已成功下載。');
    } catch (error) {
        console.error("下載原物料模板時發生錯誤:", error);
        res.status(500).json({ message: "下載原物料模板失敗。", error: error.message });
    }
};

// --- 上傳原物料 Excel 數據 ---
exports.uploadRawMaterials = async (req, res) => {
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
                const rawMaterialData = {
                    product_id: String(row['產品編號'] || '').trim(),
                    name: String(row['原物料名稱'] || '').trim(),
                    unit: String(row['單位'] || '').trim(),
                    is_active: String(row['啟用狀態 (true/false)'] || '').toLowerCase() === 'true',
                };

                // 驗證必要欄位
                if (!rawMaterialData.product_id || !rawMaterialData.name || !rawMaterialData.unit) {
                    throw new Error('必要欄位缺失 (產品編號、原物料名稱、單位)。');
                }
                // 驗證單位是否在允許的範圍內
                if (!RAW_MATERIAL_UNITS.includes(rawMaterialData.unit)) {
                    throw new Error(`無效的單位: ${rawMaterialData.unit}。`);
                }

                await prisma.rawMaterial.upsert({
                    where: { product_id: rawMaterialData.product_id },
                    update: rawMaterialData,
                    create: rawMaterialData,
                });
                successCount++;

            } catch (innerError) {
                failCount++;
                errors.push({
                    row: row,
                    message: `處理原物料 "${row['原物料名稱'] || '未知名稱'}" (產品編號: ${row['產品編號'] || 'N/A'}) 失敗: ${innerError.message}`,
                    errorDetail: innerError.message
                });
                console.error(`處理原物料資料列時發生錯誤 (產品編號: ${row['產品編號'] || 'N/A'}):`, innerError.message);
            }
        }

        if (failCount > 0) {
            res.status(200).json({
                message: `原物料上傳完成。成功 ${successCount} 筆，失敗 ${failCount} 筆。`,
                successCount,
                failCount,
                errors,
            });
        } else {
            res.status(200).json({
                message: '所有原物料數據上傳成功！',
                successCount,
                failCount,
                errors: [],
            });
        }
        console.log(`原物料數據上傳結果：成功 ${successCount} 筆，失敗 ${failCount} 筆。`);

    } catch (outerError) {
        console.error("上傳或解析原物料 Excel 文件時發生錯誤:", outerError);
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

// --- 獲取所有原物料 ---
exports.getAllRawMaterials = async (req, res) => {
    try {
        const rawMaterials = await prisma.rawMaterial.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(rawMaterials);
        console.log('已獲取所有原物料列表。');
    } catch (err) {
        console.error('獲取原物料列表時發生錯誤:', err);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取原物料列表。', error: err.message });
    }
};

// --- 獲取單一原物料 ---
exports.getRawMaterialById = async (req, res) => {
    const { id } = req.params;
    try {
        const rawMaterial = await prisma.rawMaterial.findUnique({
            where: { id: id }
        });
        if (!rawMaterial) {
            console.warn(`未找到原物料 ID: ${id}`);
            return res.status(404).json({ message: '未找到該原物料。' });
        }
        res.json(rawMaterial);
        console.log(`已獲取原物料 ID: ${id} 的詳細資訊。`);
    } catch (error) {
        console.error(`獲取原物料 ID: ${id} 時發生錯誤:`, error);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取原物料資訊。', error: error.message });
    }
};

// --- 創建原物料 ---
exports.createRawMaterial = async (req, res) => {
    const { product_id, name, unit, is_active } = req.body;
    try {
        const newRawMaterial = await prisma.rawMaterial.create({
            data: { product_id, name, unit, is_active: is_active ?? true }
        });
        res.status(201).json(newRawMaterial);
        console.log(`已成功創建原物料: ${newRawMaterial.name} (ID: ${newRawMaterial.id})`);
    } catch (err) {
        console.error('創建原物料時發生錯誤:', err);
        if (err.code === 'P2002') {
            return res.status(409).json({ message: '創建失敗：產品編號或名稱已存在。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法創建原物料。', error: err.message });
    }
};

// --- 更新原物料 ---
exports.updateRawMaterial = async (req, res) => {
    const { id } = req.params;
    const { product_id, name, unit, is_active } = req.body;
    try {
        const updatedRawMaterial = await prisma.rawMaterial.update({
            where: { id: id },
            data: { product_id, name, unit, is_active }
        });
        res.json(updatedRawMaterial);
        console.log(`已成功更新原物料 ID: ${id} (${updatedRawMaterial.name})`);
    } catch (err) {
        console.error(`更新原物料 ID: ${id} 時發生錯誤:`, err);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: '更新失敗：找不到此原物料。' });
        }
        if (err.code === 'P2002') {
            return res.status(409).json({ message: '更新失敗：產品編號或名稱已存在。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法更新原物料。', error: err.message });
    }
};

// --- 刪除原物料 ---
exports.deleteRawMaterial = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.rawMaterial.delete({
            where: { id: id }
        });
        res.status(204).send(); // No Content
        console.log(`已成功刪除原物料 ID: ${id}。`);
    } catch (err) {
        console.error(`刪除原物料 ID: ${id} 時發生錯誤:`, err);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: '刪除失敗：找不到此原物料。' });
        }
        if (err.code === 'P2003') { // 外鍵約束錯誤
            return res.status(409).json({ message: '刪除失敗：此原物料已被配方引用，請先刪除相關配方。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法刪除原物料。', error: err.message });
    }
};