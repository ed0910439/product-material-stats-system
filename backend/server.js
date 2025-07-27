// backend/server.js (主應用程式檔案)

const express = require('express');
const cors = require('cors');
const multer = require('multer'); // 用於檔案上傳
const path = require('path');
const fs = require('fs'); // 用於處理上傳後的檔案

// 導入控制器
const mealController = require('./controllers/mealsController');
const halfProductController = require('./controllers/halfProductsController');
const rawMaterialController = require('./controllers/rawMaterialsController');
const unitController = require('./controllers/unitController');
const reportController = require('./controllers/reportController'); // 報告控制器

const app = express();
const port = process.env.PORT || 5000;

// 中間件
app.use(cors()); // 啟用所有路由的 CORS
app.use(express.json()); // 解析傳入的 JSON 請求

// Multer 設定用於檔案上傳
// 確保 'uploads' 目錄存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir }); // 檔案將儲存在 'uploads' 目錄中

// --- API 路由 ---

// 餐點 (Meal) 路由
app.get('/api/meals', mealController.getAllMeals);
app.get('/api/meals/:id', mealController.getMealById);
app.post('/api/meals', mealController.createMeal);
app.put('/api/meals/:id', mealController.updateMeal);
app.delete('/api/meals/:id', mealController.deleteMeal);
app.get('/api/meals/template/download', mealController.downloadMealTemplate);
app.post('/api/meals/upload', upload.single('file'), mealController.uploadMeals);
// 統一的餐點總食材計算路由 (使用 recipeService)
app.get('/api/meals/:id/total-ingredients', mealController.getMealRawMaterialUsage);

// 半成品 (Half-Product) 路由
app.get('/api/half-products', halfProductController.getAllHalfProducts);
app.get('/api/half-products/:id', halfProductController.getHalfProductById);
app.post('/api/half-products', halfProductController.createHalfProduct);
app.put('/api/half-products/:id', halfProductController.updateHalfProduct);
app.delete('/api/half-products/:id', halfProductController.deleteHalfProduct);
app.get('/api/half-products/template/download', halfProductController.downloadHalfProductTemplate);
app.post('/api/half-products/upload', upload.single('file'), halfProductController.uploadHalfProducts);
// 統一的半成品總食材計算路由 (使用 recipeService)
app.get('/api/half-products/:id/total-ingredients', halfProductController.getHalfProductRawMaterialUsage);

// 原物料 (Raw Material) 路由
app.get('/api/raw-materials', rawMaterialController.getAllRawMaterials);
app.post('/api/raw-materials', rawMaterialController.createRawMaterial);
app.get('/api/raw-materials/:id', rawMaterialController.getRawMaterialById);
app.put('/api/raw-materials/:id', rawMaterialController.updateRawMaterial);
app.delete('/api/raw-materials/:id', rawMaterialController.deleteRawMaterial);
app.get('/api/raw-materials/template/download', rawMaterialController.downloadRawMaterialTemplate);
app.post('/api/raw-materials/upload', upload.single('file'), rawMaterialController.uploadRawMaterials);


// 單位 (UnitConversion) 路由
app.get('/api/units/conversions', unitController.getAllUnitConversions);
app.post('/api/units/conversions', unitController.createUnitConversion);
app.put('/api/units/conversions/:id', unitController.updateUnitConversion);
app.delete('/api/units/conversions/:id', unitController.deleteUnitConversion);
app.get('/api/units/all', unitController.getAllUnits); // 獲取所有可能的單位列表 (如果你的前端需要)


// 報告 (Report) 路由
// 獲取各分區銷量最好的前五樣餐點
app.get('/api/reports/top5-sales-by-category', reportController.getTop5SalesByCategories);
// 獲取指定日期範圍內的原物料使用量彙總報告
app.get('/api/reports/material-usage-summary', reportController.getMaterialUsageSummary);
// 營業匯總表上傳 (新的API)
app.post('/api/reports/upload-sales-summary', upload.single('file'), reportController.uploadSalesSummary);


// 捕捉未定義的路由
app.use((req, res, next) => {
    console.warn(`404 Not Found: 請求路徑 ${req.originalUrl}`);
    res.status(404).json({ message: '很抱歉，找不到您請求的資源。' });
});

// 全局錯誤處理器
app.use((err, req, res, next) => {
    console.error('全局錯誤:', err.stack);
    res.status(500).json({ message: '伺服器內部錯誤，請稍後再試。', error: err.message });
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`後端服務在 http://localhost:${port} 運行中...`);
});