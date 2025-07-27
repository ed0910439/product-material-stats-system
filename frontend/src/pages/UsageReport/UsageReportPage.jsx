// frontend/src/pages/UsageReport/UsageReportPage.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Table, message, Spin, Typography } from 'antd';
import { getMeals, getHalfProducts, getMealTotalIngredients, getHalfProductTotalIngredients } from '../../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const UsageReportPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meals, setMeals] = useState([]);
  const [halfProducts, setHalfProducts] = useState([]);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    const fetchSelectOptions = async () => {
      setLoading(true);
      try {
        const mealsRes = await getMeals();
        setMeals(mealsRes.data);
        const halfProductsRes = await getHalfProducts();
        setHalfProducts(halfProductsRes.data);
      } catch (error) {
        message.error('載入選擇項目失敗！');
        console.error('Error fetching select options:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSelectOptions();
  }, []);

  const onFinish = async (values) => {
    setSubmitting(true);
    setReportData([]); // 清空之前的報告
    try {
      const { itemType, itemId, quantity, unit } = values;
      let response;
      if (itemType === 'MEAL') {
        response = await getMealTotalIngredients(itemId, quantity, unit);
      } else if (itemType === 'HALF_PRODUCT') {
        response = await getHalfProductTotalIngredients(itemId, quantity, unit);
      } else {
        message.warning('請選擇要計算的項目類型！');
        return;
      }
      setReportData(response.data);
      message.success('用量計算成功！');
    } catch (error) {
      message.error('用量計算失敗！');
      console.error('Error calculating usage:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '成分名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '總用量',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      render: (text) => parseFloat(text).toFixed(2), // 保留兩位小數
    },
    {
      title: '單位',
      dataIndex: 'unit',
      key: 'unit',
    },
  ];

  if (loading) {
    return <Spin tip="載入中..."><div style={{ height: 200 }} /></Spin>;
  }

  return (
    <div>
      <Title level={2}>半成品用量報告</Title>
      <Form
        form={form}
        layout="inline"
        onFinish={onFinish}
        initialValues={{ itemType: 'MEAL', quantity: 1, unit: '份' }}
        style={{ marginBottom: 24 }}
      >
        <Form.Item
          label="項目類型"
          name="itemType"
          rules={[{ required: true, message: '請選擇類型！' }]}
        >
          <Select placeholder="選擇類型" style={{ width: 120 }}>
            <Option value="MEAL">餐點</Option>
            <Option value="HALF_PRODUCT">半成品</Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => prevValues.itemType !== curValues.itemType}
        >
          {({ getFieldValue }) => {
            const itemType = getFieldValue('itemType');
            const options = itemType === 'MEAL' ? meals : halfProducts;
            const placeholderText = itemType === 'MEAL' ? '選擇餐點' : '選擇半成品';

            return (
              <Form.Item
                label="選擇項目"
                name="itemId"
                rules={[{ required: true, message: '請選擇項目！' }]}
              >
                <Select
                  showSearch
                  placeholder={placeholderText}
                  optionFilterProp="children"
                  style={{ minWidth: 200 }}
                >
                  {options.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item
          label="計算份數"
          name="quantity"
          rules={[{ required: true, message: '請輸入份數！' }]}
        >
          <InputNumber min={1} step={0.01} />
        </Form.Item>

        <Form.Item
          label="單位"
          name="unit"
          rules={[{ required: true, message: '請輸入單位！' }]}
        >
          <Input style={{ width: 80 }} placeholder="例如：份" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            計算用量
          </Button>
        </Form.Item>
      </Form>

      {reportData.length > 0 ? (
        <>
          <Title level={4}>總用量報告</Title>
          <Table columns={columns} dataSource={reportData} rowKey="id" pagination={false} />
          {/* TODO: 添加匯出功能 */}
          <Button style={{ marginTop: 16 }}>匯出 Excel</Button>
        </>
      ) : (
        <Text type="secondary">請選擇項目並點擊「計算用量」以生成報告。</Text>
      )}
    </div>
  );
};

export default UsageReportPage;