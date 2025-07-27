// frontend/src/pages/HalfProductFormPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Switch, Input, Button, Select, InputNumber, Typography, message, Spin, Popconfirm, Space } from 'antd';
import { unstable_usePrompt as usePrompt } from 'react-router-dom';
import halfProductService from '../services/halfProductService';
import {
    HALF_PRODUCT_CATEGORIES,
    HALF_PRODUCT_CLASSIFICATIONS,
    HALF_PRODUCT_CAPACITY_UNITS,
    HALF_PRODUCT_PACKAGING_UNITS,
    SUPPLIERS
} from '../utils/constants';

const { Option } = Select;
const { Title } = Typography;

const HalfProductFormPage = () => {
    const [form] = Form.useForm();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // isFormDirty 不再是 useState，而是完全由 useMemo 計算
    // const [isFormDirty, setIsFormDirty] = useState(false);
    const initialFormValues = useRef(null); // <-- 移除這裡的註釋

    const isEditMode = !!id;

    // 使用 Form.useWatch 監聽所有表單值的變化
    const formValues = Form.useWatch([], form);

    // 儲存表單的初始值
    const [initialValuesLoaded, setInitialValuesLoaded] = useState(false);
  useEffect(() => {
        const fetchHalfProduct = async () => {
            setLoading(true);
            try {
                let dataToSet;
                if (isEditMode) {
                    const data = await halfProductService.getHalfProductById(id);
                    dataToSet = {
                        ...data,
                        category: Array.isArray(data.category) ? data.category : (data.category ? [data.category] : []),
                        unit_quantity: data.unit_quantity ? parseFloat(data.unit_quantity) : undefined,
                        is_active: typeof data.is_active === 'boolean' ? data.is_active : true,
                    };
                } else {
                    dataToSet = {
                        is_active: true,
                        category: [],
                        unit_quantity: undefined,
                        // 確保其他欄位也設定為其預設空值 (undefined 或空字串)
                        product_id: undefined,
                        name: undefined,
                        classification: undefined,
                        capacity_unit: undefined,
                        packaging_unit: undefined,
                        supplier: undefined,
                    };
                }
                form.setFieldsValue(dataToSet);
                initialFormValues.current = dataToSet; // 設定初始值
                setInitialValuesLoaded(true); // 標記初始值已載入
            } catch (error) {
                message.error(`載入半成品數據失敗: ${error.message}`);
                console.error("Failed to fetch half product:", error);
                navigate('/half-products');
            } finally {
                setLoading(false);
            }
        };
        

        fetchHalfProduct();
    }, [id, isEditMode, navigate, form]);

    // 判斷表單是否變髒的邏輯 (優化後的版本)
    const isFormDirty = useMemo(() => {
        // 載入中或初始值未設定完成時，不判斷 dirty
        if (loading || !initialValuesLoaded || !initialFormValues.current) {
            return false;
        }

        const currentFormValues = form.getFieldsValue(true);

        const deepEqual = (obj1, obj2) => {
            if (obj1 === obj2) return true;

            if (typeof obj1 !== 'object' || obj1 === null ||
                typeof obj2 !== 'object' || obj2 === null) {
                return false;
            }

            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);

            // 確保所有鍵都相同，並且值也相同
            if (keys1.length !== keys2.length) return false;

            for (const key of keys1) {
                // 統一處理 undefined/null 為相同的「空」概念
                const val1 = obj1[key] === undefined || obj1[key] === null ? null : obj1[key];
                const val2 = obj2[key] === undefined || obj2[key] === null ? null : obj2[key];

                // 特殊處理空字串和空陣列
                const finalVal1 = (typeof val1 === 'string' && val1 === '') ? null : (Array.isArray(val1) && val1.length === 0 ? null : val1);
                const finalVal2 = (typeof val2 === 'string' && val2 === '') ? null : (Array.isArray(val2) && val2.length === 0 ? null : val2);

                if (!deepEqual(finalVal1, finalVal2)) {
                    return false;
                }
            }
            return true;
        };

        // 直接比較當前表單值和初始值，deepEqual 會處理 undefined/null
        return !deepEqual(currentFormValues, initialFormValues.current);
    }, [formValues, initialValuesLoaded, loading, form]); // 新增 initialValuesLoaded 作為依賴

    usePrompt({
        when: isFormDirty,
        message: "您有未保存的更改，確定要離開嗎？",
    });

    // 未保存提醒（針對瀏覽器關閉或外部導航）
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isFormDirty) {
                event.preventDefault();
                event.returnValue = ''; // 舊版瀏覽器需要
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isFormDirty]);

      const onFinish = async (values) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...values,
                category: Array.isArray(values.category) ? values.category : (values.category ? [values.category] : []),
                unit_quantity: values.unit_quantity !== undefined && values.unit_quantity !== null ? parseFloat(values.unit_quantity) : null
            };

            if (isEditMode) {
                await halfProductService.updateHalfProduct(id, payload);
                message.success('半成品更新成功！');
            } else {
                await halfProductService.createHalfProduct(payload);
                message.success('半成品新增成功！');
            }

            // --- 關鍵修正點 ---
            // 1. 獲取當前表單的實際值作為新的「乾淨」初始值
            const updatedCleanValues = {
                ...form.getFieldsValue(true),
                // 確保類型匹配，特別是多選和數字
                category: Array.isArray(form.getFieldValue('category')) ? form.getFieldValue('category') : (form.getFieldValue('category') ? [form.getFieldValue('category')] : []),
                unit_quantity: form.getFieldValue('unit_quantity') !== undefined && form.getFieldValue('unit_quantity') !== null ? parseFloat(form.getFieldValue('unit_quantity')) : undefined,
                is_active: typeof form.getFieldValue('is_active') === 'boolean' ? form.getFieldValue('is_active') : true,
            };
            initialFormValues.current = updatedCleanValues;

            // 2. 觸發一次表單更新，以強制 Form.useWatch 和 useMemo 重新計算
            //    可以通過再次設定表單值來實現，即使值沒有改變
            form.setFieldsValue(updatedCleanValues); // 這是確保 useWatch 感知到的關鍵

            navigate('/half-products');
        } catch (error) {
            message.error(`操作失敗: ${error.message}`);
            console.error("Form submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // onBack 邏輯現在可以簡化，因為 usePrompt 會處理內部導航提示
    const onBack = () => {
        navigate('/half-products');
    };

    return (
        <Spin spinning={loading || isSubmitting} tip={isSubmitting ? "保存中..." : "載入中..."}>
            <h1>{isEditMode ? '編輯半成品' : '新增半成品'}</h1>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                // initialValues 在這裡只影響首次渲染，實際值以 form.setFieldsValue 為主
                // 這裡的 initialValues 可以移除，因為 useEffect 已經處理了載入數據和預設值
                // initialValues={{ is_active: true, category: [] }}
            >
                <Form.Item
                    name="product_id"
                    label="產品編號"
                    rules={[{ required: true, message: '請輸入產品編號！' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="半成品名稱"
                    rules={[{ required: true, message: '請輸入半成品名稱！' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="category"
                    label="類別"
                    rules={[{ required: true, message: '請選擇類別！' }]}
                >
                    <Select mode="multiple" placeholder="請選擇類別">
                        {HALF_PRODUCT_CATEGORIES.map(option => (
                            <Option key={option} value={option}>{option}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="classification"
                    label="分類"
                >
                    <Select placeholder="請選擇分類" allowClear>
                        {HALF_PRODUCT_CLASSIFICATIONS.map(option => (
                            <Option key={option} value={option}>{option}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Space align="baseline">
                    <Form.Item
                        name="unit_quantity"
                        label="容量"
                        // 確保 InputNumber 的 rule 轉換正確，並允許空值
                        rules={[{ type: 'number', message: '請輸入數字', transform: (value) => value === '' || value === null ? undefined : Number(value) }]}
                    >
                        <InputNumber min={0} placeholder="例如: 30" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="capacity_unit"
                        label="容量單位"
                    >
                        <Select placeholder="例如: 顆" allowClear style={{ width: 120 }}>
                            {HALF_PRODUCT_CAPACITY_UNITS.map(option => (
                                <Option key={option} value={option}>{option}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="packaging_unit"
                        label="包裝單位"
                    >
                        <Select placeholder="例如: 包" allowClear style={{ width: 120 }}>
                            {HALF_PRODUCT_PACKAGING_UNITS.map(option => (
                                <Option key={option} value={option}>{option}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Space>

                <Form.Item
                    name="supplier"
                    label="供貨廠商"
                >
                    <Select placeholder="請選擇供貨廠商" allowClear>
                        {SUPPLIERS.map(option => (
                            <Option key={option} value={option}>{option}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="is_active"
                    label="啟用狀態"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="啟用" unCheckedChildren="停用" />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" disabled={!isFormDirty || isSubmitting}>
                            {isEditMode ? '更新半成品' : '新增半成品'}
                        </Button>
                        <Button onClick={onBack} disabled={isSubmitting}>
                            返回
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Spin>
    );
};

export default HalfProductFormPage;