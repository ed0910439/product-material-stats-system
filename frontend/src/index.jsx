// frontend/src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 全局樣式
import App from './App.jsx'; // 更改為 .jsx

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);