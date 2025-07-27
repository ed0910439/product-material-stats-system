// frontend/src/api/index.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // 後端 API 的基礎 URL

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const reportApi = {
    // 上傳營業匯總表
    uploadSalesSummary: (file) => {
        const formData = new FormData();
        formData.append('file', file); // 'file' 必須與後端 multer 配置的字段名一致
        return api.post('/reports/sales-summary/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // 文件上傳必須使用此 Content-Type
            },
        });
    },
    // 您未來可能需要的其他報告相關 API
    // getMonthlyReport: () => api.get('/reports/monthly'),
};

const mealApi = {
    getAllMeals: () => api.get('/meals'),
    getMealById: (id) => api.get(`/meals/${id}`),
    createMeal: (data) => api.post('/meals', data),
    updateMeal: (id, data) => api.put(`/meals/${id}`, data),
    deleteMeal: (id) => api.delete(`/meals/${id}`),
    downloadTemplate: () => api.get('/meals/template/download', { responseType: 'blob' }), // 注意 responseType: 'blob'
    uploadMeals: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/meals/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

const halfProductApi = {
    getAllHalfProducts: () => api.get('/halfproducts'),
    getHalfProductById: (id) => api.get(`/halfproducts/${id}`),
    createHalfProduct: (data) => api.post('/halfproducts', data),
    updateHalfProduct: (id, data) => api.put(`/halfproducts/${id}`, data),
    deleteHalfProduct: (id) => api.delete(`/halfproducts/${id}`),
    downloadTemplate: () => api.get('/halfproducts/template/download', { responseType: 'blob' }), // 注意 responseType: 'blob'
    uploadHalfProducts: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/halfproducts/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export { reportApi, mealApi, halfProductApi };