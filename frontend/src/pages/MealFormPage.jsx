import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Form, Input, Select, Button, Space, message, Spin, Popconfirm, Table, InputNumber, Modal } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { unstable_usePrompt as usePrompt } from 'react-router-dom';
import mealService from '../services/mealService';
import halfProductService from '../services/halfProductService';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    MENU_CATEGORIES,
    MEAL_TYPES,
    getMenuClassificationsByMenuCategory,
    getHalfProductCategoriesByMealMenuCategory,
    HALF_PRODUCT_CAPACITY_UNITS // 確保這裡也引入了單位常數
} from '../utils/constants';

const { Option } = Select;

const MealFormPage = () => {
    const [form] = Form.useForm();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allHalfProducts, setAllHalfProducts] = useState([]);
    const [filteredHalfProducts, setFilteredHalfProducts] = useState([]); // 存儲經過菜單類別篩選後的半成品
    const [mealRecipes, setMealRecipes] = useState([]);
    const [editingRecipeKey, setEditingRecipeKey] = useState(null);

    const isEditMode = !!id;
    const currentFormValues = Form.useWatch([], form);
    const initialFormValues = useRef(null);

    // 加載數據
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 獲取所有半成品資料
                const hpData = await halfProductService.getAllHalfProducts();
                setAllHalfProducts(hpData);

                if (isEditMode) {
                    // 編輯模式：獲取餐點詳情
                    const mealData = await mealService.getMealById(id);

                    // 將布林轉換為字串以適應 Select 組件
                    const formattedMealData = {
                        ...mealData,
                        is_active: mealData.is_active ? 'true' : 'false',
                    };
                    form.setFieldsValue(formattedMealData); // 設置主表單值
                    initialFormValues.current = formattedMealData; // 儲存初始值
                    
                    // 設置配方列表，並添加 key 和原始值用於 dirty 判斷
                    setMealRecipes(mealData.recipes.map(recipe => ({
                        ...recipe,
                        key: recipe.id,
                        originalQuantity: recipe.required_quantity,
                        originalUnit: recipe.unit,
                        isNew: false,
                        isUpdated: false,
                        isDeleted: false,
                    })));

                    // 根據餐點的菜單類別過濾半成品選項
                    const initialMenuCategory = mealData.menu_category;
                    if (initialMenuCategory) {
                        const allowedHalfProductCategories = getHalfProductCategoriesByMealMenuCategory(initialMenuCategory);
                        const filtered = hpData.filter(hp => 
                            hp.category.some(cat => allowedHalfProductCategories.includes(cat))
                        );
                        setFilteredHalfProducts(filtered);
                    }
                } else {
                    // 新增模式：設置預設值
                    form.setFieldsValue({ is_active: 'true', product_id: '' });
                    initialFormValues.current = { is_active: 'true', product_id: '' };
                    setFilteredHalfProducts(hpData); // 新增模式下，預設顯示所有半成品
                }
            } catch (error) {
                message.error(`載入數據失敗: ${error.message}`);
                console.error("Fetch data error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isEditMode, navigate, form]);


    // 判斷表單是否變髒 (是否有未保存的變更) 的邏輯
    const isFormDirty = useMemo(() => {
        if (loading) return false;

        const currentMainFormValues = form.getFieldsValue(true);
        const normalizedCurrent = { 
            ...currentMainFormValues,
            is_active: currentMainFormValues.is_active === true ? 'true' : (currentMainFormValues.is_active === false ? 'false' : currentMainFormValues.is_active),
            product_id: currentMainFormValues.product_id || '',
            name: currentMainFormValues.name || '',
            menu_category: currentMainFormValues.menu_category || '',
            menu_classification: currentMainFormValues.menu_classification || '',
            meal_type: currentMainFormValues.meal_type || '',
        };

        const normalizedInitial = initialFormValues.current ? {
            ...initialFormValues.current,
            is_active: initialFormValues.current.is_active === true ? 'true' : (initialFormValues.current.is_active === false ? 'false' : initialFormValues.current.is_active),
            product_id: initialFormValues.current.product_id || '',
            name: initialFormValues.current.name || '',
            menu_category: initialFormValues.current.menu_category || '',
            menu_classification: initialFormValues.current.menu_classification || '',
            meal_type: initialFormValues.current.meal_type || '',
        } : {};

        const mainFields = ['product_id', 'name', 'menu_category', 'menu_classification', 'meal_type', 'is_active'];
        const isMainFormDirty = mainFields.some(field => normalizedCurrent[field] !== normalizedInitial[field]);

        const isRecipesDirty = mealRecipes.some(recipe =>
            recipe.isNew ||
            (recipe.isUpdated && (recipe.originalQuantity !== recipe.required_quantity || recipe.originalUnit !== recipe.unit)) ||
            recipe.isDeleted
        );

        return isMainFormDirty || isRecipesDirty;
    }, [currentFormValues, mealRecipes, initialFormValues, loading, form]);

    usePrompt({
        when: isFormDirty,
        message: "您有未保存的更改，確定要離開嗎？",
    });

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isFormDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isFormDirty]);


    // 當菜單類別改變時，更新菜單分類下拉選單和半成品過濾
    const handleMenuCategoryChange = (value) => {
        form.setFieldsValue({ menu_classification: undefined });
        const allowedHalfProductCategories = getHalfProductCategoriesByMealMenuCategory(value);
        
        const filtered = allHalfProducts.filter(hp => 
            hp.category.some(cat => allowedHalfProductCategories.includes(cat))
        );
        setFilteredHalfProducts(filtered);
        
        setMealRecipes([]); // 清空現有配方
    };

    // 表單提交處理
    const onFinish = async (values) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...values,
                is_active: values.is_active === 'true',
            };

            let mealResponse;
            if (isEditMode) {
                mealResponse = await mealService.updateMeal(id, payload);
                message.success('餐點更新成功！');
            } else {
                mealResponse = await mealService.createMeal(payload);
                message.success('餐點新增成功！');
            }

            const currentMealId = isEditMode ? id : mealResponse.id;

            for (const recipe of mealRecipes) {
                if (recipe.isNew && !recipe.isDeleted) {
                    await mealService.addMealRecipe(currentMealId, {
                        half_product_id: recipe.half_product_id,
                        required_quantity: recipe.required_quantity,
                        unit: recipe.unit
                    });
                } else if (recipe.isUpdated && !recipe.isDeleted) {
                    await mealService.updateMealRecipe(currentMealId, recipe.id, {
                        required_quantity: recipe.required_quantity,
                        unit: recipe.unit
                    });
                } else if (recipe.isDeleted) {
                    await mealService.deleteMealRecipe(currentMealId, recipe.id);
                }
            }
            message.success('餐點配方更新成功！');

            const updatedMealData = await mealService.getMealById(currentMealId);
            initialFormValues.current = {
                ...updatedMealData,
                is_active: updatedMealData.is_active ? 'true' : 'false'
            };
            setMealRecipes(updatedMealData.recipes.map(recipe => ({
                ...recipe,
                key: recipe.id,
                originalQuantity: recipe.required_quantity,
                originalUnit: recipe.unit,
                isNew: false,
                isUpdated: false,
                isDeleted: false,
            })));


            navigate('/meals');
        } catch (error) {
            message.error(`操作失敗: ${error.message}`);
            console.error("Form submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onBack = () => {
        if (isFormDirty) {
            Modal.confirm({
                title: '您有未保存的更改，確定要離開嗎？',
                content: '離開將會遺失所有未保存的數據。',
                okText: '確定離開',
                cancelText: '取消',
                onOk() {
                    navigate('/meals');
                },
                onCancel() {}
            });
        } else {
            navigate('/meals');
        }
    };

    const handleAddRecipe = () => {
        const newKey = `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setMealRecipes(prev => [...prev, {
            key: newKey,
            half_product_id: undefined,
            required_quantity: undefined,
            unit: undefined,
            isNew: true,
            isUpdated: false,
            isDeleted: false,
        }]);
        setEditingRecipeKey(newKey);
    };

    const handleEditRecipe = (record) => {
        setEditingRecipeKey(record.key);
    };

    const handleSaveRecipe = (key) => {
        const row = mealRecipes.find(item => item.key === key);
        if (!row.half_product_id || row.required_quantity === undefined || row.unit === undefined) {
            message.error('配方項資訊不完整，請檢查！');
            return;
        }

        setMealRecipes(prev => prev.map(item => {
            if (item.key === key) {
                if (!item.isNew && (item.originalQuantity !== item.required_quantity || item.originalUnit !== item.unit)) {
                    return { ...item, isUpdated: true };
                }
                return item;
            }
            return item;
        }));

        setEditingRecipeKey(null);
    };

    const handleCancelRecipeEdit = (key) => {
        setMealRecipes(prev => prev.filter(item => !(item.key === key && item.isNew)));
        setEditingRecipeKey(null);
    };

    const handleDeleteRecipe = (key) => {
        setMealRecipes(prev => prev.map(item =>
            item.key === key ? { ...item, isDeleted: true } : item
        ));
        message.success('配方項已標記為刪除，將在保存時生效。');
    };

    const handleRecipeFieldChange = (key, dataIndex, value) => {
        setMealRecipes(prev => prev.map(item => {
            if (item.key === key) {
                const updatedItem = { ...item, [dataIndex]: value };
                if (dataIndex === 'half_product_id') {
                    const selectedHalfProduct = allHalfProducts.find(hp => hp.id === value);
                    updatedItem.half_product_name = selectedHalfProduct?.name;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const recipeColumns = useMemo(() => {
        return [
            {
                title: '半成品名稱',
                dataIndex: 'half_product_id',
                key: 'half_product_id',
                render: (half_product_id, record) => {
                    const isEditing = record.key === editingRecipeKey;
                    const selectedHalfProduct = allHalfProducts.find(hp => hp.id === half_product_id);

                    if (isEditing) {
                        // 直接使用 filteredHalfProducts 作為選項來源
                        const options = filteredHalfProducts.map(hp => ({
                            value: hp.id,
                            label: hp.name,
                        }));

                        return (
                            <Select
                                showSearch
                                placeholder="選擇半成品"
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                value={half_product_id}
                                onChange={(value) => handleRecipeFieldChange(record.key, 'half_product_id', value)}
                                style={{ margin: 0, width: '100%' }}
                            >
                                {options.map(option => (
                                    <Option key={option.value} value={option.value}>{option.label}</Option>
                                ))}
                            </Select>
                        );
                    }
                    return record.half_product_name || (selectedHalfProduct ? selectedHalfProduct.name : 'N/A');
                },
                width: '100%',
            },
            {
                title: '所需數量',
                dataIndex: 'required_quantity',
                key: 'required_quantity',
                width: '100%',
                minWidth: '10em',

                render: (text, record) => {
                    const isEditing = record.key === editingRecipeKey;
                    return isEditing ? (
                        <InputNumber
                            placeholder="輸入數量"
                            value={text}
                            onChange={(value) => handleRecipeFieldChange(record.key, 'required_quantity', value)}
                            min={0}
                            step={0.1}
                            style={{ margin: 0, width:'100%' }}
                        />
                    ) : (
                        text
                    );
                },
            },
            {
                title: '單位',
                dataIndex: 'unit',
                key: 'unit',
                width: '100%',
                minWidth: '8em',
                render: (text, record) => {
                    const isEditing = record.key === editingRecipeKey;
                    return isEditing ? (
                        <Select
                            value={text}
                            onChange={(value) => handleRecipeFieldChange(record.key, 'unit', value)}
                            style={{ margin: 0, width: '100%' }}
                        >
                            {HALF_PRODUCT_CAPACITY_UNITS.map(unit => (
                                <Option key={unit} value={unit}>{unit}</Option>
                            ))}
                        </Select>
                    ) : (
                        text
                    );
                },
            },
            {
                title: '操作',
                key: 'action',
                render: (_, record) => {
                    const isEditing = record.key === editingRecipeKey;
                    const isDeleted = record.isDeleted;

                    if (isDeleted) {
                        return <span style={{ color: 'red' }}>待刪除</span>;
                    }

                    return (
                        <Space size="middle">
                            {isEditing ? (
                                <>
                                    <Button type="link" onClick={() => handleSaveRecipe(record.key)}>保存</Button>
                                    <Popconfirm title="確定取消編輯嗎？" onConfirm={() => handleCancelRecipeEdit(record.key)}>
                                        <Button type="link" danger>取消</Button>
                                    </Popconfirm>
                                </>
                            ) : (
                                <>
                                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEditRecipe(record)}>編輯</Button>
                                    <Popconfirm title="確定刪除此配方嗎？" onConfirm={() => handleDeleteRecipe(record.key)} okText="是" cancelText="否">
                                        <Button type="link" icon={<DeleteOutlined />} danger>刪除</Button>
                                    </Popconfirm>
                                </>
                            )}
                        </Space>
                    );
                },
            },
        ];
    }, [editingRecipeKey, allHalfProducts, filteredHalfProducts, form, handleRecipeFieldChange, handleSaveRecipe, handleCancelRecipeEdit, handleDeleteRecipe]);

    return (
        <Spin spinning={loading || isSubmitting} tip={isSubmitting ? "保存中..." : "載入中..."}>
            <h1>{isEditMode ? '編輯餐點' : '新增餐點'}</h1>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ is_active: 'true', product_id: '' }}
            >
                {/* 基本資訊 */}
                <Form.Item
                    name="product_id"
                    label="產品編號"
                    rules={[{ required: true, message: '請輸入產品編號！' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="餐點名稱"
                    rules={[{ required: true, message: '請輸入餐點名稱！' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="menu_category"
                    label="菜單類別"
                    rules={[{ required: true, message: '請選擇菜單類別！' }]}
                >
                    <Select placeholder="請選擇菜單類別" onChange={handleMenuCategoryChange}>
                        {MENU_CATEGORIES.map(cat => (
                            <Option key={cat} value={cat}>{cat}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="menu_classification"
                    label="菜單分類"
                    rules={[{ required: true, message: '請選擇菜單分類！' }]}
                >
                    <Select placeholder="請選擇菜單分類">
                        {getMenuClassificationsByMenuCategory(form.getFieldValue('menu_category')).map(cls => (
                            <Option key={cls} value={cls}>{cls}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="meal_type"
                    label="餐點類型"
                    rules={[{ required: true, message: '請選擇餐點類型！' }]}
                >
                    <Select placeholder="請選擇餐點類型">
                        {MEAL_TYPES.map(type => (
                            <Option key={type} value={type}>{type}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="is_active"
                    label="啟用狀態"
                    rules={[{ required: true, message: '請選擇啟用狀態！' }]}
                >
                    <Select placeholder="請選擇啟用狀態">
                        <Option value="true">啟用</Option>
                        <Option value="false">停用</Option>
                    </Select>
                </Form.Item>

                {/* 餐點配方區塊 */}
                <h2>餐點配方</h2>

                <Table
                    dataSource={mealRecipes.filter(r => !r.isDeleted)}
                    columns={recipeColumns}
                    rowKey="key"
                    pagination={false}
                    bordered={false}
                    style={{ marginBottom: 24 }}
                    showHeader={false}
                    footer={() => (
                        <Button
                            type="dashed"
                            onClick={handleAddRecipe}
                            icon={<PlusOutlined />}
                            style={{ width: '100%' }}
                        >
                            新增配方
                        </Button>
                    )}
                />

                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" disabled={!isFormDirty || isSubmitting}>
                            {isEditMode ? '更新餐點' : '新增餐點'}
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

export default MealFormPage;