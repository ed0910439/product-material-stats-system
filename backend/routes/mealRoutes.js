
// routes/mealRoutes.js
const express = require('express');
const router = express.Router();
const mealsController = require('../controllers/mealsController');
const multer = require('multer'); // 引入 multer

// 配置 Multer 存儲
// 你可以選擇存儲到磁碟 (diskStorage) 或內存 (memoryStorage)
// 這裡示範存儲到磁碟，並設置目標文件夾
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 確保這個目錄存在，否則會報錯
        // 例如：__dirname 是當前檔案的路徑，這裡向上退兩層到 backend 目錄
        // 然後進入 'uploads' 目錄。你需要手動創建 backend/uploads 目錄。
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // 為文件生成一個獨特的名稱
        cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage }); // 初始化 multer 中間件


router.get('/', mealsController.getAllMeals);
router.get('/:id', mealsController.getMealById);
router.post('/', mealsController.createMeal);
router.put('/:id', mealsController.updateMeal);
router.delete('/:id', mealsController.deleteMeal);
// 新增計算用量路由
router.get('/:id/usage', mealsController.getMealRawMaterialUsage);
router.get('/:id/total-ingredients', mealsController.getMealRawMaterialUsage);

// 新增獲取各分區銷量最好的前五樣餐點路由
router.get('/reports/top-five-by-region', mealsController.getTopFiveMealsByRegion);
// 新增 Excel 相關路由
router.get('/template/download', mealsController.downloadMealTemplate); // 下載模板
router.post('/upload', upload.single('file'), mealsController.uploadMeals); // 上傳文件


module.exports = router;