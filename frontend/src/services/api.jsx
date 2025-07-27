// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // 請確保這裡指向你的後端地址

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 攔截器，用於處理錯誤或自動添加 token (如果需要認證)
api.interceptors.request.use(
    (config) => {
        // const token = localStorage.getItem('token');
        // if (token) {
        //     config.headers['Authorization'] = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
            // 可以根據不同的狀態碼做處理，例如 401 未授權重定向到登入頁
            // if (error.response.status === 401) {
            //   window.location.href = '/login';
            // }
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
    }
);

// 餐點相關 API
export const getMeals = () => api.get('/meals');
export const getMealById = (id) => api.get(`/meals/${id}`); // 新增：獲取單個餐點
export const createMeal = (mealData) => api.post('/meals', mealData);
export const updateMeal = (id, mealData) => api.put(`/meals/${id}`, mealData);
export const deleteMeal = (id) => api.delete(`/meals/${id}`);
export const manageMealRecipe = (id, recipeItems) => api.post(`/meals/${id}/manage-recipe`, { recipeItems });
export const getMealTotalIngredients = (id, quantity, unit) => api.get(`/meals/${id}/total-ingredients`, { params: { quantity, unit } });
export const downloadMealsTemplate = () => {
  return api.get('/meals/template/download', {
    responseType: 'blob', // 重要：以blob格式下載文件
  });
};
export const uploadMealsFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/meals/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // 覆寫 Content-Type
        },
    });
};

// 半成品相關 API
export const getHalfProducts = () => api.get('/half-products');
export const getHalfProductById = (id) => api.get(`/half-products/${id}`); // 新增：獲取單個半成品
export const createHalfProduct = (hpData) => api.post('/half-products', hpData);
export const updateHalfProduct = (id, hpData) => api.put(`/half-products/${id}`, hpData);
export const deleteHalfProduct = (id) => api.delete(`/half-products/${id}`);
export const manageHalfProductRecipe = (id, recipeItems) => api.post(`/half-products/${id}/manage-recipe`, { recipeItems });
export const getHalfProductTotalIngredients = (id, quantity, unit) => api.get(`/half-products/${id}/total-ingredients`, { params: { quantity, unit } });
export const downloadHalfProductTemplate = () => {
  return api.get('/half-products/template/download', {
    responseType: 'blob',
  });
};

export const uploadHalfProductFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/half-products/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // 覆寫 Content-Type
        },
    });
};

// 原物料相關 API (用於選擇器)
export const getRawMaterials = () => api.get('/raw-materials'); // 假設你的後端有這個路由

// 報告相關 API
export const getTop5Sales = (category = '') => api.get(`/reports/top5-sales`, { params: { category } }); // 假設這個 API 會根據類別返回前五名
// 注意：如果你的後端銷售報告 API 需要更多參數 (例如日期範圍)，這裡也需要添加。