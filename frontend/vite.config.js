import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 配置開發伺服器的代理
    proxy: {
      '/api': { // 當前端請求以 /api 開頭時
        target: 'http://localhost:5000', // 代理到您的後端服務地址
        changeOrigin: true, // 改變源點，解決 CORS 問題
        rewrite: (path) => path.replace(/^\/api/, '/api'), // 重寫路徑，保持 /api 前綴
      },
    },
  },
  define: {
    // 定義環境變數，讓前端可以訪問
    // 注意：Vite 會自動將以 VITE_ 為前綴的環境變數暴露給前端
    // 所以我們只需要在 .env.local 或 .env 中定義 VITE_APP_API_BASE_URL
    'process.env.VITE_APP_API_BASE_URL': JSON.stringify(process.env.VITE_APP_API_BASE_URL || '/api'),
  },
});