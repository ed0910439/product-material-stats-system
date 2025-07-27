// backend/utils/excelUtils.js

const exceljs = require('exceljs');
const { BASE_UNITS } = require('../constants'); // 導入基礎單位常量

/**
 * 生成原物料使用量報告的 Excel 檔案。
 * @param {Array<Object>} data - 包含原物料使用量的數據，每個對象應有 name, quantity, unit, packaging_format。
 * @param {string} title - 報告標題。
 * @returns {Promise<Buffer>} 返回 Excel 檔案的 Buffer。
 */
exports.generateMaterialUsageReportExcel = async (data, title = '原物料使用量報告') => {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // 定義列
    worksheet.columns = [
        { header: '原物料名稱', key: 'name', width: 25 },
        { header: '總使用量', key: 'quantity', width: 15 },
        { header: '計算單位', key: 'unit', width: 12 },
        { header: '包裝格式', key: 'packaging_format', width: 25 }, // 新增包裝格式列
    ];

    // 添加數據
    data.forEach(item => {
        worksheet.addRow({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            packaging_format: item.packaging_format || 'N/A' // 如果沒有，顯示 N/A
        });
    });

    // 設置標題樣式
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // 自動調整列寬 (可能需要更精確的調整)
    worksheet.columns.forEach(column => {
        let maxColumnLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 0;
            if (columnLength > maxColumnLength) {
                maxColumnLength = columnLength;
            }
        });
        // 加上一些餘裕
        column.width = maxColumnLength < column.header.length ? column.header.length + 2 : maxColumnLength + 2;
    });


    // 返回 Buffer
    return await workbook.xlsx.writeBuffer();
};

/**
 * 生成 Top 5 銷售報告的 Excel 檔案。
 * @param {Object} data - 包含各類別 Top 5 銷售數據的對象。
 * @param {string} title - 報告標題。
 * @returns {Promise<Buffer>} 返回 Excel 檔案的 Buffer。
 */
exports.generateTop5SalesExcel = async (data, title = '各類別前五名銷售報告') => {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(title);

    worksheet.columns = [
        { header: '類別', key: 'category', width: 15 },
        { header: '產品名稱', key: 'name', width: 25 },
        { header: '銷售數量', key: 'sales', width: 15 },
    ];

    // 添加數據
    for (const category in data) {
        if (data[category].length > 0) {
            worksheet.addRow({ category: category, name: '', sales: '' }).font = { bold: true }; // 類別標題
            data[category].forEach(item => {
                worksheet.addRow({
                    category: '', // 不重複顯示類別
                    name: item.name,
                    sales: item.sales
                });
            });
            worksheet.addRow({}); // 添加空行分隔不同類別
        }
    }

    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // 自動調整列寬
    worksheet.columns.forEach(column => {
        let maxColumnLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 0;
            if (columnLength > maxColumnLength) {
                maxColumnLength = columnLength;
            }
        });
        column.width = maxColumnLength < column.header.length ? column.header.length + 2 : maxColumnLength + 2;
    });

    return await workbook.xlsx.writeBuffer();
};