import React, { useState } from 'react';
import { Table, Select, Input, DatePicker, Button, Dropdown, Menu, message, Divider } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ExportOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CalendarOutlined,
  InboxOutlined,
  StopOutlined
} from '@ant-design/icons';

import CreateOrderModal from './components/CreateOrderModal';

const { RangePicker } = DatePicker;
const { Option } = Select;

// --- COMPONENT CON: OrderStatCard (Thẻ thống kê theo nhóm) ---
const OrderStatCard = ({ title, options, icon }) => {
  const [filter, setFilter] = useState('week'); // Default filter

  return (
    <div className="bg-white p-5 rounded-[20px] shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
      
      {/* Header của Card: Tiêu đề + Bộ lọc thời gian */}
      <div className="flex justify-between items-start mb-4 z-10">
        <div className="flex items-center gap-3">
           <div className="bg-light-primary text-brand-500 w-10 h-10 rounded-full flex items-center justify-center text-xl">
              {icon}
           </div>
           <h4 className="text-lg font-bold text-navy-700">{title}</h4>
        </div>
        
        {/* Dropdown Filter nhỏ gọn */}
        <Select 
          defaultValue="week" 
          value={filter}
          onChange={setFilter}
          bordered={false}
          className="bg-[#F4F7FE] rounded-lg text-xs font-bold text-gray-600 min-w-[100px]"
          dropdownStyle={{ borderRadius: '12px' }}
        >
          <Option value="today">Hôm nay</Option>
          <Option value="yesterday">Hôm qua</Option>
          <Option value="week">Tuần này</Option>
          <Option value="month">Tháng này</Option>
        </Select>
      </div>

      {/* Nội dung thống kê (Chia cột) */}
      <div className="flex items-center justify-around z-10">
        {options.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-1">
               <span className="text-3xl font-bold text-navy-700">{item.value}</span>
               <span className="text-sm text-gray-400 font-medium">{item.label}</span>
            </div>
            {/* Đường kẻ dọc phân cách, trừ phần tử cuối */}
            {index < options.length - 1 && (
              <div className="h-10 w-[1px] bg-gray-200 mx-2"></div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Background Decor (Icon mờ) */}
      <div className="absolute -right-5 -bottom-5 text-[100px] text-gray-100 opacity-50 z-0 pointer-events-none">
        {icon}
      </div>
    </div>
  );
};

const OrderPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dữ liệu giả lập cho bảng
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      id: '#ORD-001',
      customer: 'Nguyễn Văn A',
      date: '24/01/2026',
      total: '550.000 ₫',
      status: 'Approved',
      payment: 'VNPAY',
      items: 'Bó Hoa Hồng Đỏ (x1)'
    },
    {
      key: '2',
      id: '#ORD-002',
      customer: 'Trần Thị B',
      date: '24/01/2026',
      total: '1.200.000 ₫',
      status: 'Pending',
      payment: 'COD',
      items: 'Lẵng Hoa Khai Trương (x1)'
    },
    {
      key: '3',
      id: '#ORD-003',
      customer: 'Lê Hoàng C',
      date: '23/01/2026',
      total: '350.000 ₫',
      status: 'Error',
      payment: 'Momo',
      items: 'Hộp Hoa Baby (x1)'
    },
  ]);

  const handleCreateOrder = (newOrder) => {
    const orderData = {
      key: Date.now(),
      id: newOrder.id,
      customer: newOrder.customerName,
      date: newOrder.date,
      total: `${newOrder.total.toLocaleString()} ₫`,
      status: 'Pending',
      payment: newOrder.paymentMethod,
      items: `${newOrder.products[0].name} ${newOrder.products.length > 1 ? `(+${newOrder.products.length - 1})` : ''}`
    };
    setDataSource([orderData, ...dataSource]);
    setIsModalOpen(false);
    message.success('Tạo đơn hàng thành công!');
  };

  const columns = [
    {
      title: 'MÃ ĐƠN',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-bold text-navy-700 hover:text-brand-500 cursor-pointer">{text}</span>,
    },
    {
      title: 'KHÁCH HÀNG',
      dataIndex: 'customer',
      key: 'customer',
      render: (text) => <span className="font-bold text-navy-700">{text}</span>,
    },
    {
      title: 'NGÀY ĐẶT',
      dataIndex: 'date',
      key: 'date',
      render: (text) => <span className="font-medium text-gray-500">{text}</span>,
    },
    {
      title: 'TỔNG TIỀN',
      dataIndex: 'total',
      key: 'total',
      render: (text) => <span className="font-bold text-navy-700">{text}</span>,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let icon, color, text;
        switch (status) {
          case 'Approved': icon = <CheckCircleOutlined />; color = 'text-green-500'; text = 'Hoàn thành'; break;
          case 'Pending': icon = <ClockCircleOutlined />; color = 'text-orange-500'; text = 'Chờ xử lý'; break;
          case 'Disable': icon = <ExclamationCircleOutlined />; color = 'text-orange-400'; text = 'Đang giao'; break;
          case 'Error': icon = <CloseCircleOutlined />; color = 'text-red-500'; text = 'Đã hủy'; break;
          default: icon = <CheckCircleOutlined />; color = 'text-gray-500'; text = status;
        }
        return (
          <div className={`flex items-center gap-2 ${color}`}>
            <span className="text-lg">{icon}</span>
            <span className="font-bold text-sm text-navy-700">{text}</span>
          </div>
        );
      },
    },
    {
      title: 'HÀNH ĐỘNG',
      key: 'action',
      render: () => (
        <Dropdown overlay={<Menu items={[{ key: '1', label: 'Xem chi tiết', icon: <EyeOutlined /> }, { key: '2', label: 'Xóa đơn', icon: <DeleteOutlined />, danger: true }]} />} trigger={['click']}>
          <div className="cursor-pointer text-gray-400 hover:text-navy-700 text-xl bg-light-primary w-8 h-8 flex items-center justify-center rounded-lg">
             <MoreOutlined />
          </div>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* --- PHẦN 1: 3 BẢNG THỐNG KÊ (WIDGETS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        
        {/* Bảng 1: Tổng quan đơn hàng */}
        <OrderStatCard 
          title="Tổng quan đơn hàng"
          icon={<InboxOutlined />}
          options={[
            { label: 'Tất cả', value: 128 },
            { label: 'Chờ xử lý', value: 12 },
            { label: 'Hoàn thành', value: 98 },
          ]}
        />

        {/* Bảng 2: Đơn có vấn đề */}
        <OrderStatCard 
          title="Đơn cần chú ý"
          icon={<StopOutlined />}
          options={[
            { label: 'Đã hủy', value: 5 },
            { label: 'Hoàn trả', value: 2 },
            { label: 'Hư hỏng', value: 0 },
          ]}
        />

        {/* Bảng 3: Khách hàng & Giỏ hàng */}
        <OrderStatCard 
          title="Hiệu suất khách hàng"
          icon={<ShoppingCartOutlined />}
          options={[
            { label: 'Bỏ quên giỏ', value: 24 },
            { label: 'Khách mua', value: 85 },
          ]}
        />
      </div>

      {/* --- HEADER TITLE --- */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          
        </div>
        
        <div className="flex gap-3">
          <Button icon={<ExportOutlined />} className="bg-white border-gray-200 text-gray-600 font-medium rounded-xl h-10 shadow-sm">Xuất Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-brand-500 font-medium rounded-xl h-10 shadow-brand-500/50 border-none">Tạo đơn hàng</Button>
        </div>
      </div>

      {/* --- MAIN CARD: FILTER & TABLE --- */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
        <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
               <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm đơn hàng..." className="w-full sm:w-[250px] h-[44px] rounded-xl border-none bg-[#F4F7FE] text-navy-700" />
               <Select defaultValue="all" className="h-[44px] w-[160px] custom-select-borderless bg-[#F4F7FE] rounded-xl" bordered={false}>
                 <Option value="all">Tất cả trạng thái</Option>
                 <Option value="Approved">Hoàn thành</Option>
                 <Option value="Pending">Chờ xử lý</Option>
               </Select>
               <RangePicker className="h-[44px] border-none bg-[#F4F7FE] rounded-xl" />
            </div>
            <Button type="primary" icon={<FilterOutlined />} className="bg-brand-500 h-[44px] px-6 rounded-xl border-none font-bold shadow-brand-500/50">Lọc</Button>
        </div>

        <div className="overflow-x-auto">
          <Table columns={columns} dataSource={dataSource} pagination={{ pageSize: 6 }} className="custom-table-metrix" />
        </div>
      </div>

      <CreateOrderModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreateOrder} />
    </div>
  );
};

export default OrderPage;