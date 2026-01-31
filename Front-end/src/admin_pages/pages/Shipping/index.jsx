import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, Tabs, Tooltip, message } from 'antd';
import { 
  SearchOutlined, ReloadOutlined, CarOutlined, 
  EnvironmentOutlined, FilePdfOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const ShippingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Dữ liệu giả lập
  const [shipments, setShipments] = useState([
    {
      key: '1', id: 'GHN-829392', orderId: '#ORD-001', carrier: 'GHN',
      status: 'Delivering', fee: 35000, cod: 550000,
      createdAt: '31/01/2026', customer: 'Nguyễn Văn A'
    },
    {
      key: '2', id: 'GHTK-112233', orderId: '#ORD-003', carrier: 'GHTK',
      status: 'ReadyToPick', fee: 22000, cod: 0,
      createdAt: '31/01/2026', customer: 'Lê Hoàng C'
    },
    {
      key: '3', id: 'AHA-998877', orderId: '#ORD-005', carrier: 'Ahamove',
      status: 'Returned', fee: 45000, cod: 1200000,
      createdAt: '30/01/2026', customer: 'Phạm Thị D'
    },
  ]);

  const handleSync = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Đã đồng bộ trạng thái vận đơn mới nhất!');
    }, 1000);
  };

  const columns = [
    {
      title: 'MÃ VẬN ĐƠN',
      dataIndex: 'id',
      render: (text, record) => (
        <div>
           <div className="font-bold text-brand-500 cursor-pointer hover:underline">{text}</div>
           <div className="text-xs text-gray-400">Đơn gốc: {record.orderId}</div>
        </div>
      )
    },
    {
      title: 'ĐƠN VỊ',
      dataIndex: 'carrier',
      render: (text) => (
        <Tag color={text === 'GHN' ? 'orange' : (text === 'GHTK' ? 'green' : 'blue')}>
           {text}
        </Tag>
      )
    },
    {
      title: 'KHÁCH HÀNG',
      dataIndex: 'customer',
      render: (text) => <span className="font-medium text-navy-700">{text}</span>
    },
    {
      title: 'PHÍ SHIP / COD',
      render: (_, record) => (
        <div className="text-sm">
           <div>Phí: <span className="font-bold">{record.fee.toLocaleString()}đ</span></div>
           <div className="text-gray-500">COD: {record.cod.toLocaleString()}đ</div>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      render: (status) => {
        const map = {
          ReadyToPick: { color: 'cyan', text: 'Chờ lấy hàng' },
          Delivering: { color: 'processing', text: 'Đang giao' },
          Delivered: { color: 'success', text: 'Giao thành công' },
          Returned: { color: 'error', text: 'Đang hoàn trả' },
        };
        const st = map[status] || { color: 'default', text: status };
        return <Tag color={st.color} icon={<CarOutlined />}>{st.text}</Tag>;
      }
    },
    {
      title: 'THAO TÁC',
      render: () => (
        <div className="flex gap-2">
           <Tooltip title="In tem vận đơn">
              <Button icon={<FilePdfOutlined />} size="small" />
           </Tooltip>
           <Tooltip title="Theo dõi hành trình">
              <Button icon={<EnvironmentOutlined />} size="small" className="text-blue-500 border-blue-200" />
           </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-navy-700">Quản lý Vận Chuyển</h2>
           <p className="text-gray-500 text-sm">Theo dõi hành trình đơn hàng</p>
        </div>
        <div className="flex gap-3">
           <Button icon={<ReloadOutlined />} onClick={handleSync} loading={loading} className="rounded-xl h-[40px]">Đồng bộ trạng thái</Button>
           <Button type="primary" onClick={() => navigate('/admin/shipping/config')} className="bg-brand-500 rounded-xl h-[40px] font-bold border-none">Cấu hình ĐVVC</Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[20px] shadow-sm">
         <div className="flex justify-between mb-4">
            <div className="flex gap-3">
               <Input prefix={<SearchOutlined />} placeholder="Tìm mã vận đơn, SĐT..." className="w-[250px] rounded-xl h-[40px] bg-[#F4F7FE] border-none" />
               <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl"><Option value="all">Tất cả hãng</Option><Option value="ghn">GHN</Option></Select>
            </div>
         </div>

         <Tabs defaultActiveKey="all" items={[
            { key: 'all', label: 'Tất cả' },
            { key: 'pickup', label: 'Chờ lấy hàng (1)' },
            { key: 'delivering', label: 'Đang giao (5)' },
            { key: 'issue', label: 'Sự cố / Hoàn (1)' },
         ]} />

         <Table 
            columns={columns} 
            dataSource={shipments} 
            pagination={{ pageSize: 5 }} 
            className="custom-table-metrix" 
         />
      </div>
    </div>
  );
};

export default ShippingPage;