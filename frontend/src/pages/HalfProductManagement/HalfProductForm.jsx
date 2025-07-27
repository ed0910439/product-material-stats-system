// frontend/src/pages/HalfProductManagement/HalfProductForm.jsx
import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Switch, InputNumber, message, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { createHalfProduct, getHalfProductById, updateHalfProduct } from '../../services/api';
import {
  HALF_PRODUCT_CATEGORIES,
  SUPPLIERS, // 假設您有一個 SUPPLIERS 常量定義了供應商列表
  HALF_PRODUCT_PACKAGING_UNITS, // 引入包裝單位常量
  HALF_PRODUCT_CAPACITY_UNITS, // 引入容量單位常量
} from '../../utils/constants';

const { Option } = Select;

const HalfProductForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams(); // 獲取路由中的ID，判斷是新增還是編輯
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // 編輯模式，載入半成品資料
      const fetchHalfProduct = async () => {
        setLoading(true);
        try {
          const response = await getHalfProductById(id);
          const hpData = response.data;

          // 設置表單字段值
          form.setFieldsValue({
            ...hpData,
            categories: hpData.categories || [], // 確保categories是陣列
            capacity_value: parseFloat(hpData.capacity_value), // 確保為數字類型
            is_active: hpData.is_active ?? true, // 處理undefined或null
            is_virtual: hpData.is_virtual ?? false, // 新增：處理undefined或null
          });
        } catch (error) {
          message.error('載入半成品資料失敗！');
          console.error('Error fetching half product:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchHalfProduct();
    } else {
      // 新增模式，設置默認值
      form.setFieldsValue({
        is_active: true,
        is_virtual: false, // 新增：默認非虛擬
      });
    }
  }, [id, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const dataToSave = {
        ...values,
        capacity_value: parseFloat(values.capacity_value), // 確保傳遞數字
      };

      if (id) {
        // 更新半成品
        await updateHalfProduct(id, dataToSave);
        message.success('半成品更新成功！');
      } else {
        // 創建半成品
        await createHalfProduct(dataToSave);
        message.success('半成品創建成功！');
      }
      navigate('/half-products'); // 返回列表頁
    } catch (error) {
      const errorMessage = error.response?.data?.message || '操作失敗！';
      message.error(errorMessage);
      console.error('Error saving half product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h2>{id ? '編輯半成品' : '新增半成品'}</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ is_active: true, is_virtual: false }} // 新增時的默認值
      >
        <Form.Item
          label="產品編號"
          name="product_id"
          rules={[{ required: true, message: '請輸入產品編號！' }]}
        >
          <Input placeholder="請輸入產品編號" disabled={!!id} /> {/* 編輯時不可修改 */}
        </Form.Item>

        <Form.Item
          label="半成品名稱"
          name="name"
          rules={[{ required: true, message: '請輸入半成品名稱！' }]}
        >
          <Input placeholder="請輸入半成品名稱" />
        </Form.Item>

        <Form.Item label="半成品簡稱" name="short_name">
          <Input placeholder="請輸入半成品簡稱" />
        </Form.Item>

        <Form.Item label="供貨商" name="supplier">
          <Select placeholder="選擇供貨商" allowClear>
            {/* 假設 SUPPLIERS 是在 constants.js 中定義的陣列 */}
            {SUPPLIERS.map((sup) => (
              <Option key={sup} value={sup}>
                {sup}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="半成品類別"
          name="categories"
          rules={[{ required: true, message: '請選擇至少一個類別！' }]}
        >
          <Select mode="multiple" placeholder="選擇半成品類別">
            {HALF_PRODUCT_CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="每包裝單位容量值"
          name="capacity_value"
          rules={[{ required: true, message: '請輸入每包裝單位容量值！' }]}
        >
          <InputNumber min={0} step={0.001} placeholder="例如：1.000" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="容量單位"
          name="capacity_unit"
          rules={[{ required: true, message: '請選擇容量單位！' }]}
        >
            <Select placeholder="選擇容量單位">
                {HALF_PRODUCT_CAPACITY_UNITS.map((unit) => (
                    <Option key={unit} value={unit}>{unit}</Option>
                ))}
            </Select>
        </Form.Item>

        <Form.Item
          label="包裝單位"
          name="packaging_unit"
          rules={[{ required: true, message: '請選擇包裝單位！' }]}
        >
            <Select placeholder="選擇包裝單位">
                {HALF_PRODUCT_PACKAGING_UNITS.map((unit) => (
                    <Option key={unit} value={unit}>{unit}</Option>
                ))}
            </Select>
        </Form.Item>
        
        <Form.Item label="是否啟用" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="虛擬半成品" name="is_virtual" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space> {/* 這個 Form.Item 沒有 name 屬性，所以可以包含多個子元素 */}
            <Button type="primary" htmlType="submit" loading={loading}>
              {id ? '更新' : '創建'}
            </Button>
            <Button onClick={() => navigate('/half-products')}>
              返回列表
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default HalfProductForm;