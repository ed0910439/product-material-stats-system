// frontend/src/pages/SalesReportPage.jsx
import React, { useState } from 'react';
import { reportApi } from '../services/api'; // 引入我們剛剛建立的 API 服務

const SalesReportPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [reportData, setReportData] = useState(null);
    const [topSalesData, setTopSalesData] = useState(null);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setMessage('');
        setError('');
        setReportData(null);
        setTopSalesData(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('請先選擇一個營業匯總表文件！');
            return;
        }

        setUploading(true);
        setMessage('正在上傳並處理，請稍候...');
        setError('');

        try {
            const response = await reportApi.uploadSalesSummary(selectedFile);
            setMessage(response.data.message);
            setReportData(response.data.halfProductReport);
            setTopSalesData(response.data.topSalesByMenuCategory);
        } catch (err) {
            console.error('上傳或處理銷售匯總表失敗:', err);
            setError(`上傳或處理失敗: ${err.response?.data?.error || err.response?.data || err.message}`);
            setMessage('');
        } finally {
            setUploading(false);
            setSelectedFile(null); // 清空已選文件
            if (document.getElementById('salesFile')) {
                document.getElementById('salesFile').value = ''; // 清空 input 檔案選擇框
            }
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>營業匯總報告</h1>
            <p>請上傳您的營業匯總表 (Excel 或 CSV 格式)，系統將自動計算各餐點所需的半成品用量，並生成各半成品的總使用量報告。</p>

            <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h3>上傳營業匯總表</h3>
                <input
                    type="file"
                    id="salesFile"
                    accept=".xls,.xlsx,.csv"
                    onChange={handleFileChange}
                    style={{ marginRight: '10px' }}
                />
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    {uploading ? '正在處理...' : '上傳並生成報告'}
                </button>
                {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>

            {reportData && (
                <div style={{ marginTop: '30px' }}>
                    <h2>半成品總使用量報告</h2>
                    {reportData.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f2f2f2' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>半成品名稱</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>總用量</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>單位</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.halfProductName}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.totalRequiredQuantity}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>沒有半成品使用量數據。</p>
                    )}
                </div>
            )}

            {topSalesData && (
                <div style={{ marginTop: '30px' }}>
                    <h2>各分區最佳銷量 (前五名)</h2>
                    {Object.keys(topSalesData).length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                            {Object.entries(topSalesData).map(([category, meals]) => (
                                <div key={category} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                                    <h3>{category}</h3>
                                    {meals.length > 0 ? (
                                        <ol>
                                            {meals.map((meal, index) => (
                                                <li key={index}>{meal.name}: {meal.totalSales} 份</li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <p>該類別暫無銷量數據。</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>沒有最佳銷量數據。</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SalesReportPage;