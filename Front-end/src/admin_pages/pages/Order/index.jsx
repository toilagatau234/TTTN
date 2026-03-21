import React, { useState, useEffect } from 'react';
import { Table, Select, Input, DatePicker, Button, Dropdown, Menu, message, Divider, Tag } from 'antd';
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
  InboxOutlined,
  StopOutlined,
  CarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import CreateOrderModal from './components/CreateOrderModal';
import ViewOrderDetailDrawer from './components/ViewOrderDetailDrawer';
import orderService from '../../../services/orderService';

const { RangePicker } = DatePicker;
const { Option } = Select;

// --- COMPONENT CON: OrderStatCard ---
const OrderStatCard = ({ title, options, icon }) => {
  const [filter, setFilter] = useState('week');

  return (
    <div className="bg-white p-5 rounded-[20px] shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
      
      {/* Header Card: Tiêu đề + Bộ lọc thời gian */}
      <div className="flex justify-between items-start mb-4 z-10">
        <div className="flex items-center gap-3">
           <div className="bg-light-primary text-brand-500 w-10 h-10 rounded-full flex items-center justify-center text-xl">
              {icon}
           </div>
           <h4 className="text-lg font-bold text-navy-700">{title}</h4>
        </div>
        
        {/* Dropdown Filter */}
        <Select 
          defaultValue="week" 
          value={filter}
          onChange={setFilter}
          variant="borderless"
          className="bg-[#F4F7FE] rounded-lg text-xs font-bold text-gray-600 min-w-[100px]"
          styles={{ popup: { root: { borderRadius: '12px' } } }}
        >
          <Option value="today">Hôm nay</Option>
          <Option value="yesterday">Hôm qua</Option>
          <Option value="week">Tuần này</Option>
          <Option value="month">Tháng này</Option>
        </Select>
      </div>

      {/* Nội dung thống kê */}
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
      
      {/* Background Decor */}
      <div className="absolute -right-5 -bottom-5 text-[100px] text-gray-100 opacity-50 z-0 pointer-events-none">
        {icon}
      </div>
    </div>
  );
};

const OrderPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        code: debouncedSearchText ? debouncedSearchText.trim() : undefined
      };
      
      const response = await orderService.getAllOrders(params);
      if (response && response.success) {
        setDataSource(response.data.map(item => ({ ...item, key: item._id })));
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      }
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    fetchOrders(1, pagination.pageSize);
  }, [statusFilter, debouncedSearchText]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await orderService.updateOrderStatus(id, status);
      if (response && response.success) {
        message.success('Cập nhật trạng thái thành công');
        fetchOrders(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const showDetail = (record) => {
    setSelectedOrder(record);
    setIsDrawerOpen(true);
  };

  const columns = [
    {
      title: 'MÃ ĐƠN',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (text, record) => <span className="font-bold text-navy-700 hover:text-brand-500 cursor-pointer" onClick={() => showDetail(record)}>{text}</span>,
    },
    {
      title: 'KHÁCH HÀNG',
      dataIndex: 'shippingInfo',
      key: 'customer',
      render: (val) => <span className="font-bold text-navy-700">{val?.fullName || 'N/A'}</span>,
    },
    {
      title: 'NGÀY ĐẶT',
      dataIndex: 'createdAt',
      key: 'date',
      render: (text) => <span className="font-medium text-gray-500">{dayjs(text).format('DD/MM/YYYY')}</span>,
    },
    {
      title: 'TỔNG TIỀN',
      dataIndex: 'totalPrice',
      key: 'total',
      render: (val) => <span className="font-bold text-brand-500">{(val || 0).toLocaleString()} ₫</span>,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let icon, color, text;
        switch (status) {
          case 'delivered': icon = <CheckCircleOutlined />; color = 'text-green-500'; text = 'Hoàn thành'; break;
          case 'pending': icon = <ClockCircleOutlined />; color = 'text-orange-500'; text = 'Chờ xử lý'; break;
          case 'processing': icon = <ClockCircleOutlined />; color = 'text-blue-500'; text = 'Đang chuẩn bị'; break;
          case 'shipping': icon = <CarOutlined />; color = 'text-purple-500'; text = 'Đang giao'; break;
          case 'cancelled': icon = <CloseCircleOutlined />; color = 'text-red-500'; text = 'Đã hủy'; break;
          case 'confirmed': icon = <CheckCircleOutlined />; color = 'text-cyan-500'; text = 'Đã xác nhận'; break;
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
      render: (_, record) => (
        <Dropdown 
          menu={{ items: [
            { key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => showDetail(record) },
            { 
              key: 'status_menu', 
              label: 'Cập nhật trạng thái', 
              icon: <ClockCircleOutlined />,
              children: [
                { key: 'confirmed', label: 'Xác nhận', onClick: () => handleUpdateStatus(record._id, 'confirmed') },
                { key: 'processing', label: 'Chuẩn bị', onClick: () => handleUpdateStatus(record._id, 'processing') },
                { key: 'shipping', label: 'Giao hàng', onClick: () => handleUpdateStatus(record._id, 'shipping') },
                { key: 'delivered', label: 'Đã giao', onClick: () => handleUpdateStatus(record._id, 'delivered') },
                { key: 'cancelled', label: 'Hủy đơn', danger: true, onClick: () => handleUpdateStatus(record._id, 'cancelled') }
              ]
            }
          ] }} 
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
      {/* --- BẢNG THỐNG KÊ --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        
        {/* Tổng quan đơn hàng */}
        <OrderStatCard 
          title="Tổng quan đơn hàng"
          icon={<InboxOutlined />}
          options={[
            { label: 'Tất cả', value: 128 },
            { label: 'Chờ xử lý', value: 12 },
            { label: 'Hoàn thành', value: 98 },
          ]}
        />

        {/* Đơn có vấn đề */}
        <OrderStatCard 
          title="Đơn cần chú ý"
          icon={<StopOutlined />}
          options={[
            { label: 'Đã hủy', value: 5 },
            { label: 'Hoàn trả', value: 2 },
            { label: 'Hư hỏng', value: 0 },
          ]}
        />

        {/* Khách hàng & Giỏ hàng */}
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
               <Input 
                 prefix={<SearchOutlined className="text-gray-400" />} 
                 placeholder="Tìm đơn hàng..." 
                 className="w-full sm:w-[250px] h-[44px] rounded-xl border-none bg-[#F4F7FE] text-navy-700" 
                 value={searchText}
                 onChange={(e) => setSearchText(e.target.value)}
                 allowClear
               />
               <Select 
                 value={statusFilter} 
                 onChange={setStatusFilter}
                 className="h-[44px] w-[160px] custom-select-borderless bg-[#F4F7FE] rounded-xl" 
                 variant="borderless"
               >
                 <Option value="all">Tất cả trạng thái</Option>
                 <Option value="pending">Chờ xử lý</Option>
                 <Option value="confirmed">Đã xác nhận</Option>
                 <Option value="processing">Đang chuẩn bị</Option>
                 <Option value="shipping">Đang giao</Option>
                 <Option value="delivered">Đã giao</Option>
                 <Option value="cancelled">Đã hủy</Option>
               </Select>
               <RangePicker className="h-[44px] border-none bg-[#F4F7FE] rounded-xl" />
            </div>
        </div>

        <div className="overflow-x-auto">
          <Table 
            columns={columns} 
            dataSource={dataSource} 
            pagination={pagination} 
            loading={loading}
            onChange={(p) => fetchOrders(p.current, p.pageSize)}
            className="custom-table-metrix" 
            rowKey="_id"
          />
        </div>
      </div>

      <CreateOrderModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={() => {}} />
      <ViewOrderDetailDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} order={selectedOrder} />
    </div>
  );
};

export default OrderPage;