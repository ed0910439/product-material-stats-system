// frontend/src/services/mealService.js
const API_BASE_URL = process.env.VITE_APP_API_BASE_URL; // 從 Vite 環境變數獲取 API 基礎 URL

const mealService = {
  // 獲取所有餐點
  getAllMeals: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/meals`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching meals:", error);
      throw error;
    }
  },

  // 獲取單一餐點及其配方
  getMealById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching meal with ID ${id}:`, error);
      throw error;
    }
  },

  // 新增餐點
  createMeal: async (mealData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });
      const data = await response.json();
      if (!response.ok) {
        // 處理後端返回的錯誤訊息
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error("Error creating meal:", error);
      throw error;
    }
  },

  // 更新餐點
  updateMeal: async (id, mealData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`Error updating meal with ID ${id}:`, error);
      throw error;
    }
  },

  // 刪除餐點
  deleteMeal: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      // DELETE 成功通常返回 204 No Content，此時 response.json() 會失敗
      // 所以直接返回成功標誌
      return true;
    } catch (error) {
      console.error(`Error deleting meal with ID ${id}:`, error);
      throw error;
    }
  },

  // 新增餐點配方項
  addMealRecipe: async (mealId, recipeData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meal-recipes/${mealId}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error("Error adding meal recipe:", error);
      throw error;
    }
  },

  // 更新餐點配方項
  updateMealRecipe: async (mealId, recipeId, recipeData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meal-recipes/${mealId}/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`Error updating meal recipe with ID ${recipeId}:`, error);
      throw error;
    }
  },

  // 刪除餐點配方項
  deleteMealRecipe: async (mealId, recipeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meal-recipes/${mealId}/recipes/${recipeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting meal recipe with ID ${recipeId}:`, error);
      throw error;
    }
  },
};

export default mealService;