// backend/controllers/unitController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// 引入所有常用單位，但這次我們會定義一個更嚴格的"可轉換單位"列表
// 這裡明確定義了允許進行轉換的單位
const CONVERTIBLE_UNITS = ['公斤', '公克', '公升', '毫升'];
const ALL_UNITS = ['公斤', '公克', '公升', '毫升', '個', '包', '箱', '份', '碗', '杯']; // 包含所有可能的單位，用於其他下拉選單，但只允許 CONVERTIBLE_UNITS 進行轉換

// --- 獲取所有單位轉換規則 ---
exports.getAllUnitConversions = async (req, res) => {
    try {
        const conversions = await prisma.unitConversion.findMany({
            orderBy: [{ from_unit: 'asc' }, { to_unit: 'asc' }]
        });
        res.json(conversions);
        console.log('已獲取所有單位轉換規則。');
    } catch (error) {
        console.error('獲取單位轉換規則時發生錯誤:', error);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取單位轉換規則。', error: error.message });
    }
};

// --- 創建單位轉換規則 ---
exports.createUnitConversion = async (req, res) => {
    const { from_unit, to_unit, rate } = req.body;
    try {
        // 嚴格驗證：只允許 '公斤', '公克', '公升', '毫升' 進行單位轉換
        if (!CONVERTIBLE_UNITS.includes(from_unit) || !CONVERTIBLE_UNITS.includes(to_unit)) {
            console.warn(`創建單位轉換失敗：單位 "${from_unit}" 或 "${to_unit}" 不在允許的轉換範圍內。`);
            return res.status(400).json({ message: `無效的單位。只允許 '公斤', '公克', '公升', '毫升' 之間進行轉換。` });
        }
        if (from_unit === to_unit) {
            console.warn('創建單位轉換失敗：來源單位和目標單位不能相同。');
            return res.status(400).json({ message: '來源單位和目標單位不能相同。' });
        }
        if (new prisma.Decimal(rate).lessThanOrEqualTo(0)) { // 轉換率不能為0或負數
            console.warn('創建單位轉換失敗：轉換率必須是正數。');
            return res.status(400).json({ message: '轉換率必須是正數。' });
        }

        const newConversion = await prisma.unitConversion.create({
            data: { from_unit, to_unit, rate: new prisma.Decimal(rate) }
        });
        res.status(201).json(newConversion);
        console.log(`已成功創建單位轉換規則: ${from_unit} -> ${to_unit} (率: ${rate})。`);
    } catch (error) {
        console.error('創建單位轉換規則時發生錯誤:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: '創建失敗：此轉換規則已存在。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法創建單位轉換規則。', error: error.message });
    }
};

// --- 更新單位轉換規則 ---
exports.updateUnitConversion = async (req, res) => {
    const { id } = req.params;
    const { from_unit, to_unit, rate } = req.body;
    try {
        // 嚴格驗證：只允許 '公斤', '公克', '公升', '毫升' 進行單位轉換
        if (!CONVERTIBLE_UNITS.includes(from_unit) || !CONVERTIBLE_UNITS.includes(to_unit)) {
             console.warn(`更新單位轉換失敗：單位 "${from_unit}" 或 "${to_unit}" 不在允許的轉換範圍內。`);
            return res.status(400).json({ message: `無效的單位。只允許 '公斤', '公克', '公升', '毫升' 之間進行轉換。` });
        }
        if (from_unit === to_unit) {
            console.warn('更新單位轉換失敗：來源單位和目標單位不能相同。');
            return res.status(400).json({ message: '來源單位和目標單位不能相同。' });
        }
        if (new prisma.Decimal(rate).lessThanOrEqualTo(0)) {
            console.warn('更新單位轉換失敗：轉換率必須是正數。');
            return res.status(400).json({ message: '轉換率必須是正數。' });
        }

        const updatedConversion = await prisma.unitConversion.update({
            where: { id: id },
            data: { from_unit, to_unit, rate: new prisma.Decimal(rate) }
        });
        res.json(updatedConversion);
        console.log(`已成功更新單位轉換規則 ID: ${id}。`);
    } catch (error) {
        console.error(`更新單位轉換規則 ID: ${id} 時發生錯誤:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: '更新失敗：找不到此轉換規則。' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ message: '更新失敗：此轉換規則已存在。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法更新單位轉換規則。', error: error.message });
    }
};

// --- 刪除單位轉換規則 ---
exports.deleteUnitConversion = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.unitConversion.delete({
            where: { id: id }
        });
        res.status(204).send(); // No Content
        console.log(`已成功刪除單位轉換規則 ID: ${id}。`);
    } catch (error) {
        console.error(`刪除單位轉換規則 ID: ${id} 時發生錯誤:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: '刪除失敗：找不到此轉換規則。' });
        }
        res.status(500).json({ message: '內部伺服器錯誤，無法刪除單位轉換規則。', error: error.message });
    }
};

// --- 獲取所有可能的單位列表 (供前端選擇，可以包含所有單位，但只有 CONVERTIBLE_UNITS 能被加入 UnitConversion) ---
exports.getAllUnits = async (req, res) => {
    try {
        res.json(ALL_UNITS); // 這個 API 可以返回所有單位，前端根據需要過濾
        console.log('已獲取所有通用單位列表。');
    } catch (error) {
        console.error('獲取通用單位列表時發生錯誤:', error);
        res.status(500).json({ message: '內部伺服器錯誤，無法獲取通用單位列表。', error: error.message });
    }
};