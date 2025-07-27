// frontend/src/services/halfProductService.js
import axios from 'axios'; // <-- 導入 axios

// 確保 VITE_APP_API_BASE_URL 有正確設定在 .env 或 .env.development 等檔案中
// 例如：VITE_APP_API_BASE_URL=http://localhost:5000/api
const API_BASE_URL = process.env.VITE_APP_API_BASE_URL;

const halfProductService = {
  // 獲取所有半成品
  getAllHalfProducts: async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        for (const key in filters) {
            if (Array.isArray(filters[key])) {
                filters[key].forEach(item => params.append(key, item));
            } else {
                params.append(key, filters[key]);
            }
        }
        // 使用 axios
        const response = await axios.get(`${API_BASE_URL}/half-products?${params.toString()}`); // 使用 API_BASE_URL
        return response.data;
    } catch (error) {
        console.error('Error fetching half products with filters:', error);
        throw error;
    }
  },

  // 獲取單一半成品
  getHalfProductById: async (id) => {
    try {
      // 統一使用 axios
      const response = await axios.get(`${API_BASE_URL}/half-products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching half product with ID ${id}:`, error);
      throw error;
    }
  },

  // 新增半成品
  createHalfProduct: async (halfProductData) => {
    try {
      // 統一使用 axios
      const response = await axios.post(`${API_BASE_URL}/half-products`, halfProductData); // axios 自動處理 JSON.stringify
      return response.data;
    } catch (error) {
      console.error("Error creating half product:", error);
      // axios 的錯誤響應在 error.response.data
      throw error.response ? new Error(error.response.data.message || error.message) : error;
    }
  },

  // 更新半成品
  updateHalfProduct: async (id, halfProductData) => {
    try {
      // 統一使用 axios
      const response = await axios.put(`${API_BASE_URL}/half-products/${id}`, halfProductData); // axios 自動處理 JSON.stringify
      return response.data;
    } catch (error) {
      console.error(`Error updating half product with ID ${id}:`, error);
      // axios 的錯誤響應在 error.response.data
      throw error.response ? new Error(error.response.data.message || error.message) : error;
    }
  },

  // 刪除半成品
  deleteHalfProduct: async (id) => {
    try {
      // 統一使用 axios
      const response = await axios.delete(`${API_BASE_URL}/half-products/${id}`);
      return response.data; // delete 通常返回空或成功的訊息
    } catch (error) {
      console.error(`Error deleting half product with ID ${id}:`, error);
      // axios 的錯誤響應在 error.response.data
      throw error.response ? new Error(error.response.data.message || error.message) : error;
    }
  },
};

export default halfProductService;