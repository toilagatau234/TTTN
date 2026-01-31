// src/admin_pages/pages/Products/index.jsx
import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, Progress, Dropdown, Menu, message } from 'antd';
import { 
  PlusOutlined, SearchOutlined, FilterOutlined, 
  MoreOutlined, EditOutlined, DeleteOutlined, 
  ShopOutlined, CheckCircleOutlined, WarningOutlined,
  ClockCircleOutlined, StarOutlined, ArrowUpOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // <--- 1. Import useNavigate

const { Option } = Select;

// --- COMPONENT 1: OVERVIEW WIDGET ---
const ProductOverviewWidget = () => {
  return (
    <div className="bg-white rounded-[20px] shadow-sm p-6 flex flex-col justify-center h-full">
      <h4 className="text-lg font-bold text-navy-700 mb-5">Tổng quan kho hàng</h4>
      <div className="flex items-center justify-between gap-6">
        {/* Phần 1: All Products */}
        <div className="flex items-center gap-4 flex-1 p-4 rounded-2xl bg-light-primary">
           <div className="w-12 h-12 rounded-full bg-white text-brand-500 flex items-center justify-center text-2xl shadow-sm">
              <ShopOutlined />
           </div>
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">Tổng sản phẩm</p>
              <h3 className="text-2xl font-bold text-navy-700">1,203</h3>
              <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                 <ArrowUpOutlined /> +15% <span className="text-gray-400 font-medium">so với tháng trước</span>
              </p>
           </div>
        </div>
        <div className="h-12 w-[1px] bg-gray-200"></div>
        {/* Phần 2: Active Products */}
        <div className="flex items-center gap-4 flex-1 p-4 rounded-2xl bg-green-50">
           <div className="w-12 h-12 rounded-full bg-white text-green-500 flex items-center justify-center text-2xl shadow-sm">
              <CheckCircleOutlined />
           </div>
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">Đang hoạt động</p>
              <h3 className="text-2xl font-bold text-navy-700">1,180</h3>
              <p className="text-xs font-bold text-navy-700 flex items-center gap-1">
                 98% <span className="text-gray-400 font-medium">trên tổng số</span>
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT 2: ALERT WIDGET ---
const ProductAlertWidget = () => {
  const [filter, setFilter] = useState('today');

  const alerts = [
    { label: 'Low Stock', value: 5, icon: <WarningOutlined />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Expired', value: 2, icon: <ClockCircleOutlined />, color: 'text-red-500', bg: 'bg-red-50' },
    { label: '1 Star Rating', value: 1, icon: <StarOutlined />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="bg-white rounded-[20px] shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-bold text-navy-700">Cần chú ý (Alerts)</h4>
        <Select 
          value={filter} 
          onChange={setFilter} 
          bordered={false} 
          className="bg-[#F4F7FE] rounded-lg font-bold text-gray-600 min-w-[110px]"
        >
          <Option value="today">Hôm nay</Option>
          <Option value="yesterday">Hôm qua</Option>
          <Option value="week">Tuần này</Option>
        </Select>
      </div>
      <div className="flex justify-between gap-4 flex-1 items-center">
        {alerts.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 text-center p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
             <div className={`w-10 h-10 rounded-full ${item.bg} ${item.color} flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110`}>
                {item.icon}
             </div>
             <h3 className="text-2xl font-bold text-navy-700">{item.value}</h3>
             <p className="text-xs text-gray-400 font-medium">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductPage = () => {
  const navigate = useNavigate(); // <--- 2. Sử dụng hook điều hướng
  
  // Dữ liệu giả lập (Mock data)
  const [data, setData] = useState([
    {
      key: '1',
      id: '#PROD-101',
      name: 'Bó Hoa Hồng Đỏ Lãng Mạn',
      category: 'Hoa Hồng',
      price: 550000,
      stock: 85,
      sales: 120,
      status: 'In Stock',
      image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=100&q=80'
    },
    {
      key: '2',
      id: '#PROD-102',
      name: 'Lẵng Hoa Hướng Dương',
      category: 'Hoa Khai Trương',
      price: 1200000,
      stock: 5, 
      sales: 45,
      status: 'Low Stock',
      image: 'https://images.unsplash.com/photo-1597826368522-9f4a53586d0e?auto=format&fit=crop&w=100&q=80'
    },
    {
      key: '3',
      id: '#PROD-103',
      name: 'Hộp Hoa Tulip Hà Lan',
      category: 'Hoa Nhập Khẩu',
      price: 2500000,
      stock: 0,
      sales: 200,
      status: 'Out of Stock',
      image: 'https://images.unsplash.com/photo-1588825838638-349f291350a4?auto=format&fit=crop&w=100&q=80'
    }
  ]);

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('Đã xóa sản phẩm');
  };

  const columns = [
    {
      title: 'SẢN PHẨM',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <img src={record.image} alt={text} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
          <div>
            <h5 className="font-bold text-navy-700 text-sm m-0 line-clamp-1">{text}</h5>
            <span className="text-gray-400 text-xs">{record.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'DANH MỤC',
      dataIndex: 'category',
      key: 'category',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'GIÁ',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span className="font-bold text-brand-500">{price.toLocaleString()} ₫</span>,
    },
    {
      title: 'TỒN KHO',
      dataIndex: 'stock',
      key: 'stock',
      width: 200,
      render: (stock) => (
        <div className="w-full">
          <div className="flex justify-between mb-1">
             <span className="text-xs text-gray-500 font-medium">{stock} sản phẩm</span>
          </div>
          <Progress 
            percent={stock > 100 ? 100 : stock} 
            showInfo={false} 
            strokeColor={stock < 10 ? '#FF4D4F' : '#4318FF'} 
            trailColor="#EFF4FB"
            size="small"
          />
        </div>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'In Stock' ? 'green' : (status === 'Low Stock' ? 'orange' : 'red');
        return <Tag color={color} className="rounded-md font-medium">{status}</Tag>;
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
              { key: '2', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.key) }
            ]} />
          } 
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined className="text-gray-400 text-lg" />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
           
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          // 4. Sửa onClick để chuyển trang
          onClick={() => navigate('/admin/products/create')}
          className="bg-brand-500 h-10 px-6 rounded-xl font-medium shadow-brand-500/50 border-none hover:bg-brand-600"
        >
          Thêm sản phẩm
        </Button>
      </div>

      {/* --- WIDGETS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
         <ProductOverviewWidget />
         <ProductAlertWidget />
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
        <div className="flex flex-wrap gap-4 mb-6 justify-between">
           <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm tên hoa, mã SP..." className="w-[250px] rounded-xl border-none bg-[#F4F7FE] h-[40px]" />
              <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl" bordered={false}>
                 <Option value="all">Tất cả danh mục</Option>
                 <Option value="rose">Hoa Hồng</Option>
                 <Option value="orchid">Hoa Lan</Option>
              </Select>
           </div>
           <Button icon={<FilterOutlined />} className="rounded-xl h-[40px] text-gray-500">Bộ lọc</Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={{ pageSize: 6 }} 
          className="custom-table-metrix"
        />
      </div>
      
      {/* Đã xóa <CreateProductModal /> */}
    </div>
  );
};

export default ProductPage;
