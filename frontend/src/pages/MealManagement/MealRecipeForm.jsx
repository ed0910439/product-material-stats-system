// frontend/src/pages/MealManagement/MealRecipeForm.js
import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Select, Space, message, Spin, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMealById,
  getRawMaterials,
  getHalfProducts,
  manageMealRecipe,
} from '../../services/api';
import { COMPONENT_TYPES } from '../../utils/constants';

const { Option } = Select;
const { Title, Text } = Typography;

const MealRecipeForm = () => {
  const [form] = Form.useForm();
  const { id: mealId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mealName, setMealName] = useState('');
  const [rawMaterials, setRawMaterials] = useState([]);
  const [halfProducts, setHalfProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 獲取餐點基本資訊
        const mealRes = await getMealById(mealId);
        setMealName(mealRes.data.name);

        // 獲取所有原物料和半成品列表
        const rmRes = await getRawMaterials();
        setRawMaterials(rmRes.data);
        const hpRes = await getHalfProducts();
        setHalfProducts(hpRes.data);

        // 設置配方初始值
        // 後端返回的 recipeItems 需要轉換格式以符合 Form.List 的要求
        // 每個 recipeItem 應該有一個 componentId 和 componentType
        const initialRecipeItems = mealRes.data.recipesAsParent.map(item => ({
          ...item,
          componentType: item.rawMaterialId ? 'RAW_MATERIAL' : 'HALF_PRODUCT',
          componentId: item.rawMaterialId || item.halfProductComponentId,
        }));
        form.setFieldsValue({ recipeItems: initialRecipeItems });

      } catch (error) {
        message.error('載入資料失敗！');
        console.error('Error fetching data for meal recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mealId, form]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      // 轉換數據格式以符合後端 API 要求
      const formattedItems = values.recipeItems.map(item => ({
        componentType: item.componentType,
        rawMaterialId: item.componentType === 'RAW_MATERIAL' ? item.componentId : null,
        halfProductComponentId: item.componentType === 'HALF_PRODUCT' ? item.componentId : null,
        requiredQuantity: item.requiredQuantity,
        unit: item.unit, // 這裡的單位應該是配方中定義的單位，不是成分的基礎單位
      }));
      console.log("Submitting recipe items:", formattedItems);
      await manageMealRecipe(mealId, formattedItems);
      message.success('餐點配方更新成功！');
      // navigate('/meals'); // 可選：保存後跳轉回列表頁
    } catch (error) {
      message.error('餐點配方更新失敗！');
      console.error('Error managing meal recipe:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spin tip="載入中..."><div style={{ height: 200 }} /></Spin>;
  }

  return (
    <div>
      <Title level={2}>管理餐點配方：<Text type="success">{mealName}</Text></Title>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.List name="recipeItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  {/* 成分類型 */}
                  <Form.Item
                    {...restField}
                    name={[name, 'componentType']}
                    fieldKey={[fieldKey, 'componentType']}
                    rules={[{ required: true, message: '請選擇成分類型' }]}
                    style={{ minWidth: 120 }}
                  >
                    <Select placeholder="選擇類型">
                      {COMPONENT_TYPES.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* 成分選擇 (根據類型動態顯示) */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) =>
                      prevValues.recipeItems[name]?.componentType !== curValues.recipeItems[name]?.componentType
                    }
                  >
                    {({ getFieldValue }) => {
                      const componentType = getFieldValue(['recipeItems', name, 'componentType']);
                      const options = componentType === 'RAW_MATERIAL' ? rawMaterials : halfProducts;

                      return (
                        <Form.Item
                          {...restField}
                          name={[name, 'componentId']}
                          fieldKey={[fieldKey, 'componentId']}
                          rules={[{ required: true, message: '請選擇成分' }]}
                          style={{ minWidth: 200 }}
                        >
                          <Select
                            placeholder="選擇成分"
                            showSearch
                            optionFilterProp="children"
                            // 當類型改變時，清空當前選擇的成分
                            onChange={() => {
                                form.setFieldsValue({
                                    recipeItems: form.getFieldValue('recipeItems').map((item, idx) =>
                                        idx === name ? { ...item, unit: undefined } : item
                                    )
                                });
                            }}
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

                  {/* 所需數量 */}
                  <Form.Item
                    {...restField}
                    name={[name, 'requiredQuantity']}
                    fieldKey={[fieldKey, 'requiredQuantity']}
                    rules={[{ required: true, message: '請輸入數量' }]}
                    style={{ minWidth: 100 }}
                  >
                    <InputNumber min={0.01} step={0.01} placeholder="數量" />
                  </Form.Item>

                  {/* 單位 (自動填充，但可編輯或提供下拉選單) */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) =>
                      prevValues.recipeItems[name]?.componentId !== curValues.recipeItems[name]?.componentId ||
                      prevValues.recipeItems[name]?.componentType !== curValues.recipeItems[name]?.componentType
                    }
                  >
                    {({ getFieldValue }) => {
                      const componentId = getFieldValue(['recipeItems', name, 'componentId']);
                      const componentType = getFieldValue(['recipeItems', name, 'componentType']);
                      let defaultUnit = '';

                      if (componentType === 'RAW_MATERIAL' && componentId) {
                        const rm = rawMaterials.find(r => r.id === componentId);
                        defaultUnit = rm ? rm.unit : ''; // 使用原物料的基礎單位
                      } else if (componentType === 'HALF_PRODUCT' && componentId) {
                        const hp = halfProducts.find(h => h.id === componentId);
                        defaultUnit = hp ? hp.capacity_unit : ''; // 使用半成品的容量單位
                      }

                      // 當 componentId 或 componentType 改變時，自動更新單位字段
                      if (form.getFieldValue(['recipeItems', name, 'unit']) !== defaultUnit) {
                          form.setFieldsValue({
                              recipeItems: form.getFieldValue('recipeItems').map((item, idx) =>
                                  idx === name ? { ...item, unit: defaultUnit } : item
                              )
                          });
                      }

                      return (
                        <Form.Item
                          {...restField}
                          name={[name, 'unit']}
                          fieldKey={[fieldKey, 'unit']}
                          rules={[{ required: true, message: '請輸入單位' }]}
                          style={{ minWidth: 100 }}
                        >
                          {/* 這裡可以根據需求選擇 Input (手動輸入) 或 Select (預設選項) */}
                          <Input placeholder="單位" />
                          {/* <Select placeholder="單位" options={[{label: defaultUnit, value: defaultUnit}]} /> */}
                        </Form.Item>
                      );
                    }}
                  </Form.Item>


                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}

              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加配方成分
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存配方
            </Button>
            <Button onClick={() => navigate('/meals')}>
              返回列表
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default MealRecipeForm;