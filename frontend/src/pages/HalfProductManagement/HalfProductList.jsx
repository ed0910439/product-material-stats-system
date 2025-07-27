// frontend/src/pages/HalfProductManagement/HalfProductList.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, ForkOutlined, PlusOutlined, MoreOutlined  } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getHalfProducts, deleteHalfProduct } from '../../services/api';

const HalfProductList = () => {
  const [halfProducts, setHalfProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchHalfProducts = async () => {
    setLoading(true);
    try {
      const response = await getHalfProducts();
      setHalfProducts(response.data);
    } catch (error) {
      message.error('獲取半成品列表失敗！');
      console.error('Error fetching half products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalfProducts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteHalfProduct(id);
      message.success('半成品刪除成功！');
      fetchHalfProducts(); // 刷新列表
    } catch (error) {
      message.error('半成品刪除失敗！');
      console.error('Error deleting half product:', error);
    }
  };

  const columns = [
    {
      title: '產品編號',
      dataIndex: 'product_id',
      key: 'product_id',
    },
    {
      title: '名稱',
      dataIndex: 'name',
      key: 'name',
    },/*
    {
      title: '簡稱', // 新增
      dataIndex: 'short_name',
      key: 'short_name',
    },*/
    {
      title: '供貨商', // 新增
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: '分類',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories) => categories ? categories.join(', ') : '', // 確保是陣列並格式化顯示
    },
    {
      title: '單位',
            key: 'unit',
            render: (_, record) => {
                const { capacity_value, capacity_unit, packaging_unit } = record;
                let unitString = '';
                if (capacity_value !== null && capacity_value !== undefined) {
                    unitString += capacity_value;
                }

                // 拼接容量單位
                if (capacity_unit) {
                    unitString += capacity_unit;
                }

                // 拼接包裝單位 (如果存在容量和容量單位，則加上斜槓)
                if (packaging_unit) {
                    if (capacity_value !== null && capacity_value !== undefined || capacity_unit) {
                        unitString += '/';
                    }
                    unitString += packaging_unit;
                }

                return unitString;
            },
    },
    {
      title: '啟用狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (text) => (text ? '是' : '否'),
    },
    /*{
      title: '虛擬半成品', // 新增
      dataIndex: 'is_virtual',
      key: 'is_virtual',
      render: (text) => (text ? '是' : '否'),
    },*/
  {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        // 將菜單項定義為一個陣列
        const menuItems = [
          {
            key: 'edit',
            label: '編輯', // 使用 label 代替 Menu.Item 的子元素
            icon: <EditOutlined />,
            onClick: () => navigate(`/half-products/edit/${record.id}`),
          },
          // 虛擬半成品不顯示管理配方選項
          !record.is_virtual && {
            key: 'manage-recipe',
            label: '管理配方',
            icon: <ForkOutlined />,
            onClick: () => navigate(`/half-products/${record.id}/recipe`),
          },
          {
            key: 'delete',
            // Popconfirm 仍然需要一個觸發其自身的子元素
            label: (
              <Popconfirm
                title="確定要刪除這個半成品嗎？"
                onConfirm={() => handleDelete(record.id)}
                okText="是"
                cancelText="否"
              >
                {/* 注意：這裡 Popconfirm 包裹一個 span 或其他單一元素作為其觸發器 */}
                <span>刪除</span>
              </Popconfirm>
            ),
            icon: <DeleteOutlined />,
            danger: true, // 顯示為紅色文字，表示危險操作
          },
        ].filter(Boolean); // 過濾掉條件渲染為 false 的項目

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            {/* Dropdown 的觸發器必須是單一的 React 元素 */}
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>半成品列表</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/half-products/new')}>
          新增半成品
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={halfProducts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default HalfProductList;