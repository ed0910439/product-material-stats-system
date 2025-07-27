// frontend/src/pages/MealListPage.jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Spin, Upload } from 'antd'; // 引入 Upload
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'; // 引入新的圖標
import { useNavigate } from 'react-router-dom';
import mealService from '../services/mealService'; // 確保餐點 API 服務已引入
import { MENU_CATEGORIES, MEAL_TYPES, ALL_MENU_CLASSIFICATIONS } from '../constants'; // 確保引入常數

const MealListPage = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const data = await mealService.getAllMeals();
      setMeals(data);
    } catch (error) {
      message.error('載入餐點列表失敗！');
      console.error("Failed to fetch meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await mealService.deleteMeal(id);
      message.success('餐點刪除成功！');
      fetchMeals(); // 重新載入列表
    } catch (error) {
      message.error(`刪除餐點失敗: ${error.message}`);
      console.error("Failed to delete meal:", error);
    }
  };

  // --- 新增：下載餐點數據模板功能 ---
  const handleDownloadMealTemplate = async () => {
    try {
      // 這裡假設後端有一個 API 端點 `/api/meals/template/download` 用於下載模板
      const response = await fetch('http://localhost:5000/api/meals/template/download');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meal_template.xlsx'; // 下載的檔案名稱
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success('餐點數據模板下載成功！');
    } catch (error) {
      message.error(`下載餐點模板失敗: ${error.message}`);
      console.error("Failed to download meal template:", error);
    }
  };

  // --- 新增：上傳餐點 Excel 數據功能 ---
  const handleUploadMealData = {
    name: 'file', // 上傳的檔案字段名稱
    action: 'http://localhost:5000/api/meals/upload', // 上傳的後端 API 端點
    headers: {
      // 如果需要認證，可以在這裡添加 token
      // authorization: 'Bearer YOUR_TOKEN',
    },
    accept: '.xlsx, .xls', // 只接受 Excel 檔案
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error(`${file.name} 不是一個 Excel 檔案！`);
      }
      return isExcel || Upload.LIST_IGNORE; // 如果不是 Excel 則阻止上傳
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 檔案上傳成功！`);
        fetchMeals(); // 上傳成功後重新載入列表
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 檔案上傳失敗。`);
        console.error("Upload error:", info.file.response || info.file.error);
      }
    },
  };

  const columns = [
    {
      title: '餐點名稱',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '菜單類別',
      dataIndex: 'menu_category',
      key: 'menu_category',
      filters: MENU_CATEGORIES.map(cat => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.menu_category === value,
    },
    {
      title: '餐點分類',
      dataIndex: 'menu_classification',
      key: 'menu_classification',
      filters: ALL_MENU_CLASSIFICATIONS.map(cls => ({ text: cls, value: cls })),
      onFilter: (value, record) => record.menu_classification === value,
    },
    {
      title: '餐點類別', // 這裡指的是餐點本身的分類，如「餐點」、「附加選項用」等
      dataIndex: 'meal_type',
      key: 'meal_type',
      filters: MEAL_TYPES.map(type => ({ text: type, value: type })),
      onFilter: (value, record) => record.meal_type === value,
    },
    {
      title: '啟用狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (text) => (text ? '啟用' : '停用'),
      filters: [
        { text: '啟用', value: true },
        { text: '停用', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/meals/edit/${record.id}`)}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個餐點嗎？"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button icon={<DeleteOutlined />} danger>
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>餐點管理</h1>
      <Space style={{ marginBottom: 16 }}> {/* 使用 Space 將按鈕排列 */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/meals/new')}
        >
          新增餐點
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleDownloadMealTemplate}
        >
          下載模板
        </Button>
        <Upload {...handleUploadMealData} showUploadList={false}> {/* showUploadList={false} 不顯示上傳列表 */}
          <Button icon={<UploadOutlined />}>
            上傳 Excel
          </Button>
        </Upload>
      </Space>
      <Spin spinning={loading} tip="載入中...">
        <Table
          dataSource={meals}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Spin>
    </div>
  );
};

export default MealListPage;