// frontend/src/pages/MealManagement/MealForm.js
import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Space , Button, Switch, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { createMeal, getMealById, updateMeal } from '../../services/api';
import {
  MEAL_CATEGORIES,
  MEAL_TYPES,
  MEAL_CATEGORY_CLASSIFICATION_MAP,
} from '../../utils/constants';

const { Option } = Select;

const MealForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams(); // 獲取路由中的ID，判斷是新增還是編輯
  const [loading, setLoading] = useState(false);
  const [filteredClassifications, setFilteredClassifications] = useState([]);

  useEffect(() => {
    if (id) {
      // 編輯模式，載入餐點資料
      const fetchMeal = async () => {
        setLoading(true);
        try {
          const response = await getMealById(id);
          const mealData = response.data;
          form.setFieldsValue({
            ...mealData,
            is_active: mealData.is_active || false, // 確保有默認值
          });
          // 設置分類選項
          if (mealData.category) {
            setFilteredClassifications(MEAL_CATEGORY_CLASSIFICATION_MAP[mealData.category] || MEAL_CATEGORY_CLASSIFICATION_MAP['ALL'] || []);
          }
        } catch (error) {
          message.error('載入餐點資料失敗！');
          console.error('Error fetching meal:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchMeal();
    } else {
      // 新增模式，設置預設值 (例如 is_active 為 true)
      form.setFieldsValue({ is_active: true });
    }
  }, [id, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (id) {
        // 更新餐點
        await updateMeal(id, values);
        message.success('餐點更新成功！');
      } else {
        // 創建新餐點
        await createMeal(values);
        message.success('餐點創建成功！');
      }
      navigate('/meals'); // 返回餐點列表頁
    } catch (error) {
      message.error('操作失敗！請檢查產品ID是否重複或其它錯誤。');
      console.error('Error saving meal:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理菜單類別變動，更新餐點分類選項
  const handleCategoryChange = (value) => {
    form.setFieldsValue({ classification: undefined }); // 清空當前選中的分類
    setFilteredClassifications(MEAL_CATEGORY_CLASSIFICATION_MAP[value] || MEAL_CATEGORY_CLASSIFICATION_MAP['ALL'] || []);
  };

  return (
    <div>
      <h2>{id ? '編輯餐點' : '新增餐點'}</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ is_active: true }} // 新增時預設啟用
      >
        <Form.Item
          label="產品ID"
          name="product_id"
          rules={[{ required: true, message: '請輸入產品ID！' }]}
        >
          <Input disabled={!!id} placeholder="餐點的唯一ID" />
        </Form.Item>

        <Form.Item
          label="名稱"
          name="name"
          rules={[{ required: true, message: '請輸入餐點名稱！' }]}
        >
          <Input placeholder="餐點名稱" />
        </Form.Item>

        <Form.Item
          label="菜單類別"
          name="category"
          rules={[{ required: true, message: '請選擇菜單類別！' }]}
        >
          <Select placeholder="選擇菜單類別" onChange={handleCategoryChange}>
            {MEAL_CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
             <Option key="ALL" value="ALL">
                ALL
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
            label="餐點分類"
            name="classification"
            rules={[{ required: true, message: '請選擇餐點分類！' }]}
            // 由於分類選項會動態變化，這裡使用 key 讓 Ant Design 重新渲染 Select
            key={form.getFieldValue('category')}
        >
            <Select placeholder="選擇餐點分類" disabled={!form.getFieldValue('category')}>
                {filteredClassifications.map((cls) => (
                    <Option key={cls} value={cls}>
                        {cls}
                    </Option>
                ))}
            </Select>
        </Form.Item>

        <Form.Item
          label="餐點類型"
          name="meal_type"
          rules={[{ required: true, message: '請選擇餐點類型！' }]}
        >
          <Select placeholder="選擇餐點類型">
            {MEAL_TYPES.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="是否啟用" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {id ? '更新' : '創建'}
            </Button>
            <Button onClick={() => navigate('/meals')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default MealForm;