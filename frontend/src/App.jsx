// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './pages/layouts/AppHeader'; // 更改為 
import AppSider from './pages/layouts/AppSider'; // 更改為 
import DashboardPage from './pages/Dashboard/DashboardPage'; // 更改為 
import MealList from './pages/MealManagement/MealList'; // 更改為 
import MealForm from './pages/MealManagement/MealForm'; // 更改為 
import MealRecipeForm from './pages/MealManagement/MealRecipeForm'; // 更改為 
import HalfProductList from './pages/HalfProductManagement/HalfProductList'; // 更改為 
import HalfProductForm from './pages/HalfProductManagement/HalfProductForm'; // 更改為 
import HalfProductRecipeForm from './pages/HalfProductManagement/HalfProductRecipeForm'; // 更改為 
import UsageReportPage from './pages/UsageReport/UsageReportPage'; // 更改為 
import SalesReportPage from './pages/SalesReport/SalesReportPage'; // 更改為 
import DataUploadPage from './pages/DataUpload/DataUploadPage'; // 更改為 

const { Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <AppSider /> {/* 左側導航欄 */}
        <Layout className="site-layout">
          <AppHeader /> {/* 頂部標頭 */}
          <Content style={{ margin: '16px' }}>
            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/meals" element={<MealList />} />
                <Route path="/meals/new" element={<MealForm />} />
                <Route path="/meals/edit/:id" element={<MealForm />} />
                <Route path="/meals/:id/recipe" element={<MealRecipeForm />} />

                <Route path="/half-products" element={<HalfProductList />} />
                <Route path="/half-products/new" element={<HalfProductForm />} />
                <Route path="/half-products/edit/:id" element={<HalfProductForm />} />
                <Route path="/half-products/:id/recipe" element={<HalfProductRecipeForm />} />

                <Route path="/reports/usage" element={<UsageReportPage />} />
                <Route path="/reports/sales" element={<SalesReportPage />} />
                <Route path="/data-upload" element={<DataUploadPage />} />

                {/* 更多路由可以添加在這裡 */}
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;