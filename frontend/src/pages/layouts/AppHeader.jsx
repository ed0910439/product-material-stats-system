// frontend/src/layouts/AppHeader.jsx
import React from 'react';
import { Layout } from 'antd';

const { Header } = Layout;

const AppHeader = () => {
  return (
    <Header
      className="site-layout-background"
      style={{
        padding: 0,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '24px',
        paddingRight: '24px',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)'
      }}
    >
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>產品銷售物料統計系統</div>
      {/* 你可以在這裡添加用戶資訊、登出按鈕等 */}
      <div>
        {/* <Button type="link">登出</Button> */}
      </div>
    </Header>
  );
};

export default AppHeader;