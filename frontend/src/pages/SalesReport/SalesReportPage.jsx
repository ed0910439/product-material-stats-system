// frontend/src/pages/SalesReport/SalesReportPage.js
import React, { useState, useEffect } from 'react';
import { Select, Card, Row, Col, message, Spin, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTop5Sales } from '../../services/api';
import { MEAL_CATEGORIES } from '../../utils/constants';

const { Option } = Select;
const { Title, Text } = Typography;

const SalesReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('牛區'); // 預設選擇牛區
  const [top5Sales, setTop5Sales] = useState([]); // 存儲各類別前五名數據

  const fetchTop5Sales = async (category) => {
    setLoading(true);
    try {
      const response = await getTop5Sales(category);
      setTop5Sales(response.data);
      if (response.data.length === 0) {
        message.info(`目前沒有 ${category} 的銷售數據。`);
      }
    } catch (error) {
      message.error(`獲取 ${category} 銷售數據失敗！`);
      console.error(`Error fetching top 5 sales for ${category}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTop5Sales(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };

  return (
    <div>
      <Title level={2}>銷售報告</Title>
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ marginRight: 8 }}>選擇菜單類別:</Text>
        <Select
          defaultValue="牛區"
          style={{ width: 120 }}
          onChange={handleCategoryChange}
        >
          {MEAL_CATEGORIES.map(category => (
            <Option key={category} value={category}>
              {category}
            </Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spin tip="載入銷售數據..." style={{ display: 'block', margin: 'auto' }} />
      ) : (
        <Card title={`${selectedCategory} 銷量最好的前五樣餐點`} bordered={false}>
          {top5Sales.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={top5Sales}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /> {/* 假設返回的數據有 name (餐點名稱) */}
                <YAxis /> {/* 假設返回的數據有 count (銷售數量) */}
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="銷售數量" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Text type="secondary">無數據可供顯示。</Text>
          )}
        </Card>
      )}

      {/* 這裡可以選擇添加更多詳細的銷售表格或其他圖表 */}
    </div>
  );
};

export default SalesReportPage;