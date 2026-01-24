import React, { useState } from 'react';
import { Table, Select, Input, DatePicker, Button, Dropdown, Menu, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ExportOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // --- DỮ LIỆU GIẢ LẬP (MOCK DATA) ---
  const initialData = [
    {
      key: '1',
      id: '#ORD-001',
      customer: 'Nguyễn Văn A',
      date: '24/01/2026',
      total: '550.000 ₫',
      status: 'Approved', // Đã duyệt/Hoàn thành
      payment: 'VNPAY',
      items: 'Bó Hoa Hồng Đỏ (x1)'
    },
    {
      key: '2',
      id: '#ORD-002',
      customer: 'Trần Thị B',
      date: '24/01/2026',
      total: '1.200.000 ₫',
      status: 'Pending', // Chờ xử lý
      payment: 'COD',
      items: 'Lẵng Hoa Khai Trương (x1)'
    },
    {
      key: '3',
      id: '#ORD-003',
      customer: 'Lê Hoàng C',
      date: '23/01/2026',
      total: '350.000 ₫',
      status: 'Error', // Đã hủy
      payment: 'Momo',
      items: 'Hộp Hoa Baby (x1)'
    },
    {
      key: '4',
      id: '#ORD-004',
      customer: 'Phạm Thu D',
      date: '22/01/2026',
      total: '890.000 ₫',
      status: 'Disable', // Tạm hoãn
      payment: 'COD',
      items: 'Bó Hướng Dương (x2)'
    },
    {
      key: '5',
      id: '#ORD-005',
      customer: 'Hoàng Văn E',
      date: '21/01/2026',
      total: '2.500.000 ₫',
      status: 'Approved',
      payment: 'Banking',
      items: 'Lan Hồ Điệp (x1)'
    },
  ];

  // --- CẤU HÌNH CỘT (COLUMNS) ---
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
          case 'Approved':
            icon = <CheckCircleOutlined />;
            color = 'text-green-500';
            text = 'Hoàn thành';
            break;
          case 'Pending':
            icon = <ClockCircleOutlined />;
            color = 'text-orange-500';
            text = 'Chờ xử lý';
            break;
          case 'Disable':
            icon = <ExclamationCircleOutlined />;
            color = 'text-orange-400';
            text = 'Đang giao';
            break;
          case 'Error':
            icon = <CloseCircleOutlined />;
            color = 'text-red-500';
            text = 'Đã hủy';
            break;
          default:
            icon = <CheckCircleOutlined />;
            color = 'text-gray-500';
            text = status;
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
        <Dropdown 
          overlay={
            <Menu items={[
              { key: '1', label: 'Xem chi tiết', icon: <EyeOutlined /> },
              { key: '2', label: 'Xóa đơn', icon: <DeleteOutlined />, danger: true },
            ]} />
          } 
          trigger={['click']}
        >
          <div className="cursor-pointer text-gray-400 hover:text-navy-700 text-xl bg-light-primary w-8 h-8 flex items-center justify-center rounded-lg">
             <MoreOutlined />
          </div>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      
      {/* --- HEADER TITLE --- */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-navy-700">Quản lý Đơn hàng</h2>
           <p className="text-gray-500 text-sm">Kiểm tra và cập nhật trạng thái các đơn đặt hoa</p>
        </div>
        <Button 
          icon={<ExportOutlined />} 
          className="bg-white border-gray-200 text-gray-600 font-medium rounded-xl h-10 shadow-sm hover:text-brand-500 hover:border-brand-500"
        >
          Xuất Excel
        </Button>
      </div>

      {/* --- MAIN CARD --- */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
        
        {/* --- FILTER BAR (Giống mẫu Metrix) --- */}
        <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
            
            {/* Left: Search & Select */}
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
               <div className="relative">
                  <Input 
                    prefix={<SearchOutlined className="text-gray-400" />}
                    placeholder="Tìm đơn hàng..." 
                    className="w-full sm:w-[250px] h-[44px] rounded-xl border-none bg-[#F4F7FE] text-navy-700 placeholder:text-gray-400 focus:ring-0"
                  />
               </div>

               <Select 
                 defaultValue="all" 
                 className="h-[44px] w-[160px] custom-select-borderless"
                 dropdownStyle={{ borderRadius: '12px', padding: '10px' }}
                 bordered={false}
                 style={{ backgroundColor: '#F4F7FE', borderRadius: '12px' }}
               >
                 <Option value="all">Tất cả trạng thái</Option>
                 <Option value="Approved">Hoàn thành</Option>
                 <Option value="Pending">Chờ xử lý</Option>
                 <Option value="Error">Đã hủy</Option>
               </Select>

               <RangePicker 
                 className="h-[44px] border-none bg-[#F4F7FE] rounded-xl"
                 format="DD/MM/YYYY"
               />
            </div>

            {/* Right: Filter Button */}
            <Button 
               type="primary" 
               icon={<FilterOutlined />}
               className="bg-brand-500 h-[44px] px-6 rounded-xl border-none font-bold shadow-brand-500/50"
            >
              Lọc Dữ Liệu
            </Button>
        </div>

        {/* --- TABLE --- */}
        <div className="overflow-x-auto">
          <Table 
            columns={columns} 
            dataSource={initialData} 
            pagination={{ pageSize: 6 }} 
            className="custom-table-metrix"
          />
        </div>

      </div>
    </div>
  );
};

export default OrderPage;