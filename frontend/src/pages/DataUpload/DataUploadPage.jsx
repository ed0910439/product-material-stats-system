// frontend/src/pages/DataUpload/DataUploadPage.js
import React, { useState } from 'react';
import axios from 'axios';

import { Upload, Button, message, Space, Typography, Radio } from 'antd';
import { FolderAddOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import {
  downloadMealsTemplate,
  downloadHalfProductTemplate,
  uploadMealsFile,
  uploadHalfProductFile,
} from '../../services/api';

const { Title, Paragraph } = Typography;

const DataUploadPage = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dataType, setDataType] = useState('meals'); // or 'half-products'

  const handleDataTypeChange = e => {
    setDataType(e.target.value);
  };

  const handleDownloadTemplate = async (dataType) => {
    try {
      let response;
      
      // 根據資料類型選擇API端點
      if (dataType === 'meals') {
        response = await axios.get('http://localhost:5000/api/meals/template/download', {
          responseType: 'blob', // 重要：設定為blob，接收二進位檔案流
        });
      } else {
        response = await axios.get('http://localhost:5000/api/half-products/template/download', {
          responseType: 'blob',
        });
      }

      // 檢查響應狀態
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 創建Blob並下載
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      
      // 設定下載檔名，避免中文亂碼
      const filename = `${dataType}_template.xlsx`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();

      // 釋放臨時 URL
      window.URL.revokeObjectURL(url);

      message.success(`${dataType === 'meals' ? '餐點' : '半成品'}數據模板下載成功！`);
    } catch (error) {
      message.error(`下載${dataType === 'meals' ? '餐點' : '半成品'}模板失敗: ${error.message}`);
      console.error("Failed to download template:", error);
    }
  };

  const props = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // 限制文件類型
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';
      const isCSV = file.type === 'text/csv';

      if (!isExcel && !isCSV) {
        message.error('只能上傳 Excel (.xlsx/.xls) 或 CSV 文件！');
        return Upload.LIST_IGNORE;
      }
      setFileList([file]); // 只允許一個文件
      return false; // 不自動傳送
    },
    fileList,
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('請先選擇一個文件！');
      return;
    }

    setUploading(true);
    try {
      if (dataType === 'meals') {
        // 上傳餐點資料
        await uploadMealsFile(fileList[0]);
      } else {
        // 上傳半成品資料
        await uploadHalfProductFile(fileList[0]);
      }
      message.success('文件上傳成功！');
      setFileList([]); // 清空文件
    } catch (error) {
      message.error(`文件上傳失敗: ${error.response?.data?.message || error.message}`);
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Title level={2}>資料上傳</Title>
      <Paragraph>
        您可以上傳營業匯總表或其他後台資料（例如：餐點列表、半成品列表）來批量更新系統數據。
        目前支援 Excel (.xlsx/.xls) 和 CSV 格式。
      </Paragraph>

      {/* 資料類型選擇 */}
      <Radio.Group
        onChange={handleDataTypeChange}
        value={dataType}
        style={{ marginBottom: 16 }}
      >
        <Radio value="meals">餐點</Radio>
        <Radio value="half-products">半成品</Radio>
      </Radio.Group>

      {/* 下載模板按鈕 */}

      {/* 文件選擇與上傳 */}
      <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
        <Upload {...props}>
          <Button icon={<FolderAddOutlined />} >選擇文件</Button>
        </Upload>
      </Space>
      <Button icon={<UploadOutlined />}
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? '上傳中...' : '開始上傳'}
      </Button>
      <Button icon={<DownloadOutlined />} style={{ marginLeft: 16 }} onClick={() => handleDownloadTemplate(dataType)}>下載{dataType === 'meals' ? '餐點' : '半成品'}模板</Button>


      <Paragraph style={{ marginTop: 24, color: 'gray' }}>
        提示：請確保您的 Excel/CSV 文件的欄位名稱與系統期望的數據模型相符，否則可能導致資料解析錯誤。
        例如，營業匯總表應包含「餐點名稱」、「銷售數量」等欄位。
      </Paragraph>
    </div>
  );
};

export default DataUploadPage;

