// backend/controllers/mealRecipesController.js
const pool = require('../db');

// 獲取某餐點的所有配方 (已在 mealsController.js 的 getMealById 中處理)
// 但為了一致性，也可以提供單獨的 API
exports.getMealRecipes = async (req, res) => {
  const { mealId } = req.params;
  try {
    const result = await pool.query(
      'SELECT mr.*, hp.name AS half_product_name, hp.category AS half_product_category, hp.unit AS half_product_base_unit FROM meal_recipes mr JOIN half_products hp ON mr.half_product_id = hp.id WHERE mr.meal_id = $1 ORDER BY hp.name ASC',
      [mealId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(`Error fetching recipes for meal ID ${mealId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 為餐點新增配方項
exports.addMealRecipe = async (req, res) => {
  const { mealId } = req.params;
  const { half_product_id, required_quantity, unit } = req.body; // 注意這裡的 unit 是配方單位

  // 簡單的輸入驗證
  if (!half_product_id || !required_quantity || !unit) {
    return res.status(400).json({ message: 'Missing required fields for meal recipe.' });
  }

  try {
    // 檢查 mealId 和 half_product_id 是否存在 (可選，資料庫外鍵已處理部分)
    const mealExists = await pool.query('SELECT 1 FROM meals WHERE id = $1', [mealId]);
    if (mealExists.rows.length === 0) {
      return res.status(404).json({ message: 'Meal not found.' });
    }
    const halfProductExists = await pool.query('SELECT 1 FROM half_products WHERE id = $1', [half_product_id]);
    if (halfProductExists.rows.length === 0) {
      return res.status(404).json({ message: 'Half product not found.' });
    }

    const result = await pool.query(
      'INSERT INTO meal_recipes (meal_id, half_product_id, required_quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
      [mealId, half_product_id, required_quantity, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding meal recipe:', err);
    if (err.code === '23505') { // 唯一約束衝突 (meal_id, half_product_id 已存在)
      return res.status(409).json({ message: 'This half product is already in the recipe for this meal.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 更新餐點配方項
exports.updateMealRecipe = async (req, res) => {
  const { mealId, recipeId } = req.params;
  const { required_quantity, unit } = req.body;

  if (!required_quantity || !unit) {
    return res.status(400).json({ message: 'Missing required fields for updating meal recipe.' });
  }

  try {
    const result = await pool.query(
      'UPDATE meal_recipes SET required_quantity = $1, unit = $2, updated_at = NOW() WHERE id = $3 AND meal_id = $4 RETURNING *',
      [required_quantity, unit, recipeId, mealId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Meal recipe not found for this meal.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating meal recipe with ID ${recipeId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 刪除餐點配方項
exports.deleteMealRecipe = async (req, res) => {
  const { mealId, recipeId } = req.params;
  try {
    const result = await pool.query('DELETE FROM meal_recipes WHERE id = $1 AND meal_id = $2 RETURNING id', [recipeId, mealId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Meal recipe not found for this meal.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(`Error deleting meal recipe with ID ${recipeId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};