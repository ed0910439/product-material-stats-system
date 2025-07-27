// frontend/src/pages/HalfProductListPage.jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Spin, Upload, Select } from 'antd'; // 引入 Select
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import halfProductService from '../services/halfProductService'; // 引入半成品 API 服務
import { HALF_PRODUCT_CATEGORIES, HALF_PRODUCT_CLASSIFICATIONS, SUPPLIERS } from '../utils/constants';
const { Option } = Select; // 為了 Select 組件

const HalfProductListPage = () => {
    const [halfProducts, setHalfProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        sortBy: 'product_id',
        order: 'ascend' 
    });

    // 修改 useEffect 依賴於 filters
    useEffect(() => {
        fetchHalfProducts(filters); // 初次載入和 filters 變化時觸發
    }, [filters]); // <--- 這裡很重要，當 filters 變化時重新載入數據

    // 修改 fetchHalfProducts 以接受篩選條件
    const fetchHalfProducts = async (currentFilters) => {
        setLoading(true);
        try {
            // 將篩選條件傳遞給後端服務
            const data = await halfProductService.getAllHalfProducts(currentFilters);
            setHalfProducts(data);
        } catch (error) {
            message.error('載入半成品列表失敗！');
            console.error("Failed to fetch half products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await halfProductService.deleteHalfProduct(id);
            message.success('半成品刪除成功！');
            fetchHalfProducts(); // 重新載入列表
        } catch (error) {
            message.error(`刪除半成品失敗: ${error.message}`);
            console.error("Failed to delete half product:", error);
        }
    };
    // --- 新增：下載半成品數據模板功能 ---
    const handleDownloadHalfProductTemplate = async () => {
        try {
            // 這裡假設後端有一個 API 端點 `/api/half-products/template/download` 用於下載模板
            const response = await fetch('http://localhost:5000/api/half-products/template/download');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'half_product_template.xlsx'; // 下載的檔案名稱
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            message.success('半成品數據模板下載成功！');
        } catch (error) {
            message.error(`下載半成品模板失敗: ${error.message}`);
            console.error("Failed to download half product template:", error);
        }
    };

    // --- 新增：上傳半成品 Excel 數據功能 ---
    const handleUploadHalfProductData = {
        name: 'file', // 上傳的檔案字段名稱
        action: 'http://localhost:5000/api/half-products/upload', // 上傳的後端 API 端點
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
                fetchHalfProducts(); // 上傳成功後重新載入列表
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} 檔案上傳失敗。`);
                console.error("Upload error:", info.file.response || info.file.error);
            }
        },
    };
    // 新增：處理 Ant Design Table 的 onChange 事件，用於服務器端篩選、排序、分頁
   const handleTableChange = (pagination, tableFilters, sorter) => {
        const newFilters = {};
        // 處理篩選條件
        for (const key in tableFilters) {
            const filterValue = tableFilters[key];
            if (Array.isArray(filterValue) && filterValue.length > 0) {
                newFilters[key] = filterValue;
            } else if (filterValue !== undefined && filterValue !== null && !Array.isArray(filterValue)) {
                newFilters[key] = filterValue;
            }
        }

        // 處理排序條件
        if (sorter && sorter.columnKey && sorter.order) {
            // Ant Design 的 order 是 'ascend' 或 'descend'
            // Prisma 需要 'asc' 或 'desc'
            const order = sorter.order === 'ascend' ? 'asc' : 'desc';
            newFilters.sortBy = sorter.columnKey; // 排序的欄位
            newFilters.order = order; // 排序方向
        } else {
            // 如果沒有排序，或排序被取消 (例如點擊第三下)，則清除排序條件
            // 但為了「載入時編號升序」，我們在這裡不移除預設排序
            // 除非您明確希望取消排序後不按任何順序
            // 這裡可以選擇：要麼保留預設，要麼完全清空
            // 如果要保留預設，可以在 setFilters 時，將預設排序作為 fallback
             delete newFilters.sortBy;
             delete newFilters.order;
        }

        // 當沒有任何篩選或排序時，回到預設的編號升序
        if (Object.keys(newFilters).length === 0) {
             setFilters({ sortBy: 'product_id', order: 'ascend' });
        } else {
            setFilters(newFilters); // 更新篩選和排序狀態，這會觸發 useEffect
        }

    };

    const columns = [
        {
            title: '編號',
            dataIndex: 'product_id',
            key: 'product_id',
            sorter: true, // <--- 修改這裡！
            width: '50px', // 設定寬度以避免編號欄位過窄
            align: 'center', // 將編號欄位置中對齊
        },
        {
            title: '品名',
            dataIndex: 'name',
            key: 'name',
            sorter: true,   
            width: '200px', // 設定寬度以避免品名欄位過窄
        },
        {
            title: '類別',
            dataIndex: 'category',
            key: 'category',
            // Ant Design filters 列表，用於顯示下拉選項
            filters: HALF_PRODUCT_CATEGORIES.map(cat => ({ text: cat, value: cat })),
            // onFilter 屬性在此處**移除**，因為我們將轉為後端篩選
            // 但是，Ant Design 的 Table Filter UI 仍然需要這個 filters 屬性來顯示選項
            render: (categories) => categories ? categories.join(', ') : '', // 將類別陣列顯示為逗號分隔字串
        },
        {
            title: '單位',
            key: 'unit',
            render: (_, record) => {
                const { capacity_value, capacity_unit, packaging_unit } = record;
                let unitString = '';
                if (capacity_value !== null && capacity_value !== undefined) {
                    unitString += capacity_value;
                }

                // 拼接容量單位
                if (capacity_unit) {
                    unitString += capacity_unit;
                }

                // 拼接包裝單位 (如果存在容量和容量單位，則加上斜槓)
                if (packaging_unit) {
                    if (capacity_value !== null && capacity_value !== undefined || capacity_unit) {
                        unitString += '/';
                    }
                    unitString += packaging_unit;
                }

                return unitString;
            },
        },
        /*{
            title: '廠商',
            dataIndex: 'supplier',
            key: 'supplier',
            // filters 可以加在這裡
            filters: SUPPLIERS.map(sup => ({ text: sup, value: sup })), // 新增供應商篩選器
            // onFilter 屬性在此處**移除**
            render: (supplier) => {
                // 如果 supplier 是一個物件，且有名稱屬性 (如果後端是關聯查詢)
                if (typeof supplier === 'object' && supplier !== null && supplier.name) {
                    return supplier.name;
                }
                // 如果 supplier 已經是字串
                return supplier;
            },
        },*/
        {
            title: '狀態',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (text) => (text ? '啟用' : '停用'),
            filters: [
                { text: '啟用', value: true },
                { text: '停用', value: false },
            ],
        },
        {
            title: '操作',
            key: 'actions',
            render: (_, record) => (
                <div>
                    <Button
                        style={{ marginRight: 8, marginBottom: 8 }}
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/half-products/edit/${record.id}`)}
                    >
                        編輯
                    </Button>
                              
                    <Popconfirm
                        title="確定要刪除這個半成品嗎？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="是"
                        cancelText="否"
                    >
                        <Button icon={<DeleteOutlined />} danger>
                            刪除
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div>
            <h1>半成品管理</h1>
            <Space style={{ marginBottom: 16 }}> {/* 使用 Space 將按鈕排列 */}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/half-products/new')}
                >
                    新增半成品
                </Button>
                <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadHalfProductTemplate}
                >
                    下載模板
                </Button>
                <Upload {...handleUploadHalfProductData} showUploadList={false}>
                    <Button icon={<UploadOutlined />}>
                        上傳 Excel
                    </Button>
                </Upload>
                <Select
                      mode="multiple" // 允許選擇多個類別
                      placeholder="按類別篩選"
                      style={{ width: 200 }}
                      onChange={(values) => setFilters(prev => ({ ...prev, category: values }))}
                      value={filters.category}
                  >
                      {HALF_PRODUCT_CATEGORIES.map(cat => (
                          <Option key={cat} value={cat}>{cat}</Option>
                      ))}
                  </Select>
            </Space>
            <Spin spinning={loading} tip="載入中...">
                <Table
                    dataSource={halfProducts}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    bordered
                    onChange={handleTableChange}
                    scroll={{ x: 600, }}
                />
            </Spin>
        </div>
    );
};

export default HalfProductListPage;