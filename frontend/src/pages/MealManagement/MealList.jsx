// frontend/src/pages/MealManagement/MealList.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, ForkOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMeals, deleteMeal } from '../../services/api';

const MealList = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const response = await getMeals();
      setMeals(response.data);
    } catch (error) {
      message.error('獲取餐點列表失敗！');
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteMeal(id);
      message.success('餐點刪除成功！');
      fetchMeals(); // 刷新列表
    } catch (error) {
      message.error('餐點刪除失敗！');
      console.error('Error deleting meal:', error);
    }
  };

  const columns = [
    {
      title: '產品ID',
      dataIndex: 'product_id',
      key: 'product_id',
    },
    {
      title: '名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '分類',
      dataIndex: 'classification',
      key: 'classification',
    },
    {
      title: '類型',
      dataIndex: 'meal_type',
      key: 'meal_type',
    },
    {
      title: '是否啟用',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (text) => (text ? '是' : '否'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => navigate(`/meals/edit/${record.id}`)}>
            編輯
          </Button>
          <Button icon={<ForkOutlined />} onClick={() => navigate(`/meals/${record.id}/recipe`)}>
            管理配方
          </Button>
          <Popconfirm
            title="確定要刪除這個餐點嗎？"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button danger icon={<DeleteOutlined />}>
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>餐點列表</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/meals/new')}>
          新增餐點
        </Button>
      </div>
      <Table columns={columns} dataSource={meals} rowKey="id" loading={loading} />
    </div>
  );
};

export default MealList;