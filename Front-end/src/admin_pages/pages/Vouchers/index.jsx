import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, Dropdown, Menu, message, Progress } from 'antd';
import { 
  PlusOutlined, SearchOutlined, FilterOutlined, 
  MoreOutlined, EditOutlined, DeleteOutlined, 
  BarcodeOutlined, CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';

import CreateVoucherModal from './components/CreateVoucherModal';

const { Option } = Select;

// Widget Thống kê
const VoucherStatCard = ({ icon, title, value, sub, color }) => (
  <div className="bg-white p-5 rounded-[20px] shadow-sm flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-navy-700">{value}</h3>
      {sub && <p className="text-xs text-green-500 font-bold">{sub}</p>}
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>
      {icon}
    </div>
  </div>
);

const VoucherPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [data, setData] = useState([
    {
      key: '1', id: 1, code: 'FLW-WELCOME', name: 'Chào mừng thành viên mới',
      type: 'percent', value: 10, maxDiscount: 50000, minOrder: 200000,
      limit: 1000, used: 450,
      startDate: '01/01/2026', endDate: '31/12/2026', status: 'Active'
    },
    {
      key: '2', id: 2, code: 'TET2026', name: 'Lì xì Tết Nguyên Đán',
      type: 'fixed', value: 50000, minOrder: 500000,
      limit: 200, used: 200, // Đã hết
      startDate: '10/01/2026', endDate: '20/01/2026', status: 'Expired'
    },
  ]);

  const handleCreate = (newItem) => {
    setData([newItem, ...data]);
    setIsModalOpen(false);
  };

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('Đã xóa mã giảm giá');
  };

  const columns = [
    {
      title: 'MÃ VOUCHER',
      dataIndex: 'code',
      key: 'code',
      render: (text, record) => (
        <div>
          <h5 className="font-bold text-brand-500 text-base m-0 border border-dashed border-brand-500 rounded px-2 py-1 inline-block bg-blue-50">
            {text}
          </h5>
          <div className="text-gray-500 text-xs mt-1">{record.name}</div>
        </div>
      ),
    },
    {
      title: 'GIÁ TRỊ GIẢM',
      key: 'value',
      render: (_, record) => (
        <div>
           <span className="font-bold text-navy-700 text-lg">
             {record.type === 'percent' ? `${record.value}%` : `${record.value.toLocaleString()} đ`}
           </span>
           {record.type === 'percent' && (
             <div className="text-xs text-gray-400">Tối đa: {record.maxDiscount?.toLocaleString()} đ</div>
           )}
           <div className="text-xs text-gray-400">Đơn từ: {record.minOrder?.toLocaleString()} đ</div>
        </div>
      ),
    },
    {
      title: 'LƯỢT DÙNG',
      key: 'usage',
      width: 200,
      render: (_, record) => {
        const percent = Math.round((record.used / record.limit) * 100);
        return (
          <div className="w-full">
            <div className="flex justify-between mb-1 text-xs">
               <span className="text-gray-500">{record.used}/{record.limit}</span>
               <span className="font-bold text-brand-500">{percent}%</span>
            </div>
            <Progress percent={percent} showInfo={false} size="small" status={percent >= 100 ? 'exception' : 'active'} />
          </div>
        );
      }
    },
    {
      title: 'THỜI GIAN',
      key: 'time',
      render: (_, record) => (
        <div className="text-xs text-gray-500">
           <div>{record.startDate}</div>
           <div>↓</div>
           <div>{record.endDate}</div>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'Active' ? 'green' : 'default';
        let icon = status === 'Active' ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
        let text = status === 'Active' ? 'Đang chạy' : 'Kết thúc';
        return <Tag icon={icon} color={color} className="rounded-md font-medium px-2 py-1">{text}</Tag>;
      },
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Dropdown 
          overlay={
            <Menu items={[
              { key: '1', label: 'Chỉnh sửa', icon: <EditOutlined /> },
              { key: '2', label: 'Kết thúc sớm', icon: <ClockCircleOutlined /> },
              { key: '3', label: 'Xóa mã', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.key) }
            ]} />
          } 
        >
          <Button type="text" icon={<MoreOutlined className="text-gray-400 text-lg" />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
           
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-500 h-10 px-6 rounded-xl font-bold shadow-brand-500/50 border-none hover:bg-brand-600"
        >
          Tạo Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
         <VoucherStatCard title="Đang hoạt động" value={data.filter(i => i.status === 'Active').length} icon={<BarcodeOutlined />} color="bg-light-primary text-brand-500" />
         <VoucherStatCard title="Tổng lượt dùng" value="650" sub="+12 hôm nay" icon={<CheckCircleOutlined />} color="bg-green-50 text-green-500" />
         <VoucherStatCard title="Đã hết hạn" value={data.filter(i => i.status !== 'Active').length} icon={<ClockCircleOutlined />} color="bg-gray-100 text-gray-500" />
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
         <div className="flex justify-between mb-4">
            <div className="flex gap-3">
               <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm mã code..." className="w-[250px] rounded-xl h-[40px] border-none bg-[#F4F7FE]" />
               <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl"><Option value="all">Tất cả</Option><Option value="active">Đang chạy</Option></Select>
            </div>
            <Button icon={<FilterOutlined />} className="rounded-xl h-[40px] text-gray-500">Lọc</Button>
         </div>
         <Table columns={columns} dataSource={data} pagination={{ pageSize: 6 }} className="custom-table-metrix" />
      </div>

      <CreateVoucherModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default VoucherPage;