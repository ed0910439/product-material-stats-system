// frontend/src/layouts/AppSider.jsx
import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  PieChartOutlined,
  ContainerOutlined,
  ForkOutlined,
  UploadOutlined,
  FileTextOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Sider } = Layout;

const AppSider = () => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: <Link to="/">儀表板</Link>,
    },
    {
      key: 'sub1',
      icon: <ContainerOutlined />,
      label: '餐點管理',
      children: [
        {
          key: '2',
          label: <Link to="/meals">餐點列表</Link>,
        },
        {
          key: '3',
          label: <Link to="/meals/new">新增餐點</Link>,
        },
      ],
    },
    {
      key: 'sub2',
      icon: <ForkOutlined />,
      label: '半成品管理',
      children: [
        {
          key: '4',
          label: <Link to="/half-products">半成品列表</Link>,
        },
        {
          key: '5',
          label: <Link to="/half-products/new">新增半成品</Link>,
        },
      ],
    },
    {
      key: '6',
      icon: <FileTextOutlined />,
      label: <Link to="/reports/usage">用量報告</Link>,
    },
    {
      key: '7',
      icon: <PieChartOutlined />,
      label: <Link to="/reports/sales">銷售報告</Link>,
    },
    {
      key: '8',
      icon: <UploadOutlined />,
      label: <Link to="/data-upload">資料上傳</Link>,
    },
  ];

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
      <div className="logo" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px' }} />
      <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={menuItems} /> {/* 使用 items 屬性 */}
    </Sider>
  );
};

export default AppSider;