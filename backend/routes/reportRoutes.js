// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/sales-summary/upload', upload.single('file'), reportController.processSalesSummary);

router.get('/top5-sales', reportController.getTop5Sales); // <-- 添加這一行

module.exports = router;