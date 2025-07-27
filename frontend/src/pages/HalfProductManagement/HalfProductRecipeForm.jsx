// frontend/src/pages/HalfProductManagement/HalfProductRecipeForm.js
import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Select, Space, message, Spin, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getHalfProductById,
  getRawMaterials,
  getHalfProducts,
  manageHalfProductRecipe,
} from '../../services/api';
// 不再需要從 constants 引入 COMPONENT_TYPES，因為類型選擇器已移除
// import { COMPONENT_TYPES } from '../../utils/constants'; 

const { Option } = Select;
const { Title, Text } = Typography;

const HalfProductRecipeForm = () => {
  const [form] = Form.useForm();
  const { id: halfProductId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [halfProductName, setHalfProductName] = useState('');
  // 不再需要單獨的原物料或半成品狀態，因為它們已合併為「可用成分」
  // const [rawMaterials, setRawMaterials] = useState([]); 
  // const [halfProducts, setHalfProducts] = useState([]); 
  const [availableItems, setAvailableItems] = useState([]); // 新增：合併所有可用成分的狀態
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 獲取半成品基本資訊
        const hpRes = await getHalfProductById(halfProductId);
        setHalfProductName(hpRes.data.name);

        // 獲取所有原物料和半成品供選擇
        const rawMaterialsRes = await getRawMaterials();
        const halfProductsRes = await getHalfProducts();

        // 合併原物料和半成品，並過濾掉當前正在編輯的半成品自身
        const allAvailableItems = [
          ...rawMaterialsRes.data,
          ...halfProductsRes.data.filter((hp) => hp.id !== halfProductId),
        ];
        console.log('所有可用成分:', allAvailableItems); // 繁體中文註解
        setAvailableItems(allAvailableItems); // 設定合併後的列表

        // 如果是編輯現有配方，載入配方資料
        if (hpRes.data.components && hpRes.data.components.length > 0) {
          form.setFieldsValue({
            components: hpRes.data.components.map(comp => ({
              // 這裡不再需要 component_type，因為後端邏輯已統一
              item_id: comp.item_id,
              quantity: parseFloat(comp.quantity),
              unit: comp.unit,
            }))
          });
        } else {
          // 如果沒有現有配方，提供一個空組件以便添加
          form.setFieldsValue({
            components: [{ quantity: 1, unit: '' }] // 移除了 component_type
          });
        }
      } catch (error) {
        message.error('載入資料失敗！'); // 繁體中文訊息
        console.error('載入資料錯誤:', error); // 繁體中文註解
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [halfProductId, form]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        components: values.components.map(comp => ({
          // 這裡不再包含 component_type
          item_id: comp.item_id,
          quantity: parseFloat(comp.quantity),
          unit: comp.unit,
        })),
      };
      await manageHalfProductRecipe(halfProductId, payload);
      message.success('半成品配方更新成功！'); // 繁體中文訊息
      navigate('/half-products');
    } catch (error) {
      message.error('半成品配方更新失敗！'); // 繁體中文訊息
      console.error('管理半成品配方錯誤:', error); // 繁體中文註解
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Title level={2}>管理半成品配方</Title> {/* 繁體中文標題 */}
      <Text>半成品名稱: {halfProductName}</Text> {/* 繁體中文標籤 */}
      <Spin spinning={loading || submitting} tip={submitting ? "正在保存..." : "正在載入..."}> {/* 繁體中文提示 */}
        <Form
          form={form}
          name="half_product_recipe_form"
          onFinish={onFinish}
          initialValues={{ components: [{ quantity: 1, unit: '' }] }} // 移除了 component_type
          layout="vertical"
        >
          <Form.List name="components">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    {/* 這裡移除了 component_type 的 Form.Item 和 Select */}

                    <Form.Item
                      {...restField}
                      name={[name, 'item_id']}
                      rules={[{ required: true, message: '請選擇成分' }]}
                    >
                      {/* 現在只有一個選擇器，用於所有可用成分 */}
                      <Select
                        showSearch
                        placeholder="請選擇成分" // 繁體中文提示
                        optionFilterProp="children"
                        optionLabelProp="children"
                        filterOption={(input, option) => {
                          // 確保 option.children 是字串再進行比對
                          const text = String(option.children || '').toLowerCase();
                          return text.includes(input.toLowerCase());
                        }}
                        style={{ minWidth: 200 }}
                      >
                        {availableItems.length > 0 ? (
                          availableItems.map(item => ( // 遍歷合併後的 availableItems
                            <Option key={item.id} value={item.id}>
                              {String(item.name) || ''} ({String(item.product_id) || ''})
                            </Option>
                          ))
                        ) : (
                          <Option value="">無可用成分</Option> 
                        )}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '請輸入數量' }]}
                      style={{ minWidth: 80 }}
                    >
                      <InputNumber min={1} placeholder="數量" style={{ width: '100%' }} /> {/* 繁體中文提示 */}
                    </Form.Item>

                    {/* 單位 */}
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const selectedItemId = form.getFieldValue(['components', name, 'item_id']);
                        // 從合併後的 availableItems 中查找選中的項目
                        const selectedItem = availableItems.find(
                          (item) => item.id === selectedItemId
                        );

                        const defaultUnit = selectedItem ? selectedItem.capacity_unit : '';

                        // 如果單位為空且有預設單位，則自動設定單位
                        if (!form.getFieldValue(['components', name, 'unit']) && defaultUnit) {
                          form.setFieldsValue({
                            components: form.getFieldValue('components').map(
                              (item, idx) =>
                                idx === name ? { ...item, unit: defaultUnit } : item
                            )
                          });
                        }

                        return (
                          <Form.Item
                            {...restField}
                            name={[name, 'unit']}
                            rules={[{ required: true, message: '請輸入單位' }]} 
                            style={{ minWidth: 100 }}
                          >
                            <Input placeholder="單位" /> {/* 繁體中文提示 */}
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
                  </Button> {/* 繁體中文按鈕文字 */}
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                保存配方
              </Button> {/* 繁體中文按鈕文字 */}
              <Button onClick={() => navigate('/half-products')}>
                返回列表
              </Button> {/* 繁體中文按鈕文字 */}
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
};

export default HalfProductRecipeForm;