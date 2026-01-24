import React, { useState } from 'react';
import { Table, Tag, Input, Select, DatePicker, Button, Space, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  FilterOutlined, 
  ReloadOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // --- MOCK DATA (Dữ liệu giả lập cho Hoa Tươi) ---
  const initialData = [
    {
      key: '1',
      id: '#ORD-7829',
      customer: 'Nguyễn Văn A',
      date: '2025-10-24',
      total: 550000,
      payment: 'COD',
      status: 'Pending', // Chờ xử lý
      items: 'Bó hoa hồng đỏ (x1)',
    },
    {
      key: '2',
      id: '#ORD-7830',
      customer: 'Trần Thị B',
      date: '2025-10-24',
      total: 1200000,
      payment: 'VNPAY',
      status: 'Processing', // Đang cắm hoa
      items: 'Lẵng hoa khai trương (x1)',
    },
    {
      key: '3',
      id: '#ORD-7831',
      customer: 'Lê Hoàng C',
      date: '2025-10-23',
      total: 350000,
      payment: 'Momo',
      status: 'Delivered', // Giao thành công
      items: 'Hộp hoa baby (x1)',
    },
    {
      key: '4',
      id: '#ORD-7832',
      customer: 'Phạm Thu D',
      date: '2025-10-22',
      total: 890000,
      payment: 'COD',
      status: 'Cancelled', // Đã hủy
      items: 'Bó hoa hướng dương (x2)',
    },
  ];

  const [dataSource, setDataSource] = useState(initialData);

  // --- CẤU HÌNH CỘT CHO BẢNG ---
  const columns = [
    {
      title: 'Mã Đơn',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-bold text-brand-500 cursor-pointer hover:underline">{text}</span>,
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
      render: (text) => (
        <div>
          <p className="font-medium text-navy-700">{text}</p>
        </div>
      ),
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'items',
      key: 'items',
      responsive: ['lg'], // Chỉ hiện trên màn hình lớn
      render: (text) => <span className="text-gray-500 text-sm">{text}</span>,
    },
    {
      title: 'Ngày Đặt',
      dataIndex: 'date',
      key: 'date',
      render: (text) => (
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarOutlined /> {text}
        </div>
      ),
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'total',
      key: 'total',
      render: (amount) => (
        <span className="font-bold text-navy-700">
          {amount.toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let label = 'Không rõ';

        switch (status) {
          case 'Pending':
            color = 'orange';
            label = 'Chờ xử lý';
            break;
          case 'Processing':
            color = 'blue';
            label = 'Đang cắm hoa';
            break;
          case 'Delivered':
            color = 'green';
            label = 'Hoàn thành';
            break;
          case 'Cancelled':
            color = 'red';
            label = 'Đã hủy';
            break;
          default:
            break;
        }
        return (
          <Tag color={color} className="rounded-md px-2 py-1 font-medium border-0">
            {label}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            className="text-gray-500 hover:text-brand-500 hover:bg-light-primary"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy-700">Danh sách đơn hàng</h2>
          <p className="text-gray-500">Quản lý các đơn đặt hoa từ khách hàng</p>
        </div>
        
        <div className="flex gap-2">
           <Button icon={<ReloadOutlined />} onClick={() => {}} className="border-gray-200 text-gray-500 rounded-xl">
             Làm mới
           </Button>
           <Button type="primary" className="bg-brand-500 font-medium rounded-xl shadow-brand-500/50">
             Xuất Excel
           </Button>
        </div>
      </div>

      {/* --- CARD LỌC VÀ BẢNG --- */}
      <div className="bg-white p-5 rounded-[20px] shadow-sm">
        
        {/* THANH CÔNG CỤ LỌC */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* 1. Tìm kiếm */}
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Tìm theo tên, mã đơn..." 
            className="w-full md:w-[250px] rounded-xl py-2 bg-light-primary border-none text-navy-700 placeholder:text-gray-400"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {/* 2. Lọc Trạng Thái */}
          <Select 
            defaultValue="all" 
            className="w-[180px] h-[40px] custom-select-metrix"
            bordered={false}
            style={{ backgroundColor: '#F4F7FE', borderRadius: '12px' }}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="pending">Chờ xử lý</Option>
            <Option value="processing">Đang cắm hoa</Option>
            <Option value="delivered">Đã giao</Option>
            <Option value="cancelled">Đã hủy</Option>
          </Select>

          {/* 3. Lọc Ngày */}
          <RangePicker 
            className="rounded-xl border-none bg-light-primary py-2" 
            format="DD/MM/YYYY"
          />
          
          <Button 
            icon={<FilterOutlined />} 
            className="border-none bg-light-primary text-brand-500 font-medium rounded-xl h-[40px]"
          >
            Lọc
          </Button>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{ 
            pageSize: 5,
            itemRender: (page, type, originalElement) => {
              if (type === 'prev') return <a className="text-gray-500">Trước</a>;
              if (type === 'next') return <a className="text-gray-500">Sau</a>;
              return originalElement;
            }
          }}
          className="custom-table-metrix"
        />
      </div>
    </div>
  );
};

export default OrderPage;