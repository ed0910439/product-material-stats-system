// frontend/src/pages/Dashboard/DashboardPage.js
import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={2}>歡迎使用產品銷售物料統計系統！</Title>
      <Paragraph>
        本系統旨在協助您更方便地管理產品銷售物料的計算。
        您可以上傳營業匯總表、管理餐點及半成品配方，並查看各種用量及銷售報告。
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/meals')}
            title="餐點管理"
            bordered={false}
          >
            <p>新增、編輯、刪除餐點並管理其配方。</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/half-products')}
            title="半成品管理"
            bordered={false}
          >
            <p>新增、編輯、刪除半成品並管理其配方。</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/data-upload')}
            title="資料上傳"
            bordered={false}
          >
            <p>上傳營業匯總表及其他後台資料。</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/reports/usage')}
            title="用量報告"
            bordered={false}
          >
            <p>計算特定餐點或半成品所需的原物料用量。</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/reports/sales')}
            title="銷售報告"
            bordered={false}
          >
            <p>查看各分區銷量最好的前五名餐點。</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;