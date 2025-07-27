// backend/routes/mealRecipesRoutes.js
const express = require('express');
const router = express.Router();
const mealRecipesController = require('../controllers/mealRecipesController');

router.get('/:mealId/recipes', mealRecipesController.getMealRecipes); // 獲取某餐點的配方
router.post('/:mealId/recipes', mealRecipesController.addMealRecipe); // 新增配方項
router.put('/:mealId/recipes/:recipeId', mealRecipesController.updateMealRecipe); // 更新配方項
router.delete('/:mealId/recipes/:recipeId', mealRecipesController.deleteMealRecipe); // 刪除配方項

module.exports = router;