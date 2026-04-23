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
import shippingService from '../../../services/shippingService';
import statsService from '../../../services/statsService';

const { RangePicker } = DatePicker;
const { Option } = Select;

// --- COMPONENT CON: OrderStatCard ---
const OrderStatCard = ({ title, options, icon }) => {
  return (
    <div className="bg-white p-6 rounded-[24px] shadow-premium flex flex-col justify-between h-full border border-white/50 relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      
      {/* Header Card: Tiêu đề */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div className="flex items-center gap-4">
           <div className="bg-[#F4F7FE] text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-500">
              {icon}
           </div>
           <h4 className="text-lg font-black text-[#2B3674] tracking-tight m-0">{title}</h4>
        </div>
      </div>

      {/* Nội dung thống kê */}
      <div className="flex items-center justify-around z-10 py-2">
        {options.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-1 group/item cursor-pointer">
               <span className="text-3xl font-black text-[#2B3674] tracking-tighter group-hover/item:text-blue-600 transition-colors">{item.value ?? 0}</span>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
            </div>
            {/* Đường kẻ dọc phân cách */}
            {index < options.length - 1 && (
              <div className="h-10 w-px bg-gray-100"></div>
            )}
          </React.Fragment>
        ))}
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

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    abandoned: 0,
    customers: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState('week');

  // Filters
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await statsService.getOrderStatusStats({ period: statsPeriod });
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    } finally {
      setStatsLoading(false);
    }
  };

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

  useEffect(() => {
    fetchStats();
  }, [statsPeriod]);

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

  const handleCreateShipment = async (orderId) => {
    try {
      message.loading({ content: 'Đang đẩy đơn sang GHN...', key: 'pushGHN' });
      // Lấy danh sách carrier và tìm GHN proxy mặc định
      const carrierRes = await shippingService.getCarriers();
      if (!carrierRes.success || !carrierRes.data.length) {
          return message.error({ content: 'Không tìm thấy cấu hình Đối tác Vận Chuyển', key: 'pushGHN' });
      }
      const activeCarrier = carrierRes.data.find(c => c.isActive) || carrierRes.data[0];
      
      const response = await shippingService.createShipment(orderId, activeCarrier._id);
      if (response && response.success) {
        message.success({ content: response.message || 'Tạo vận đơn GHN thành công', key: 'pushGHN', duration: 3 });
        fetchOrders(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      message.error({ content: error.response?.data?.message || 'Lỗi khi đẩy đơn GHN', key: 'pushGHN', duration: 4 });
    }
  };

  const showDetail = (record) => {
    setSelectedOrder(record);
    setIsDrawerOpen(true);
  };

  const columns = [
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Mã đơn hàng</span>,
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (text, record) => (
        <span 
          className="font-black text-[#2B3674] hover:text-blue-600 cursor-pointer transition-colors pl-2" 
          onClick={() => showDetail(record)}
        >
          #{text}
        </span>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</span>,
      dataIndex: 'shippingInfo',
      key: 'customer',
      render: (val) => (
        <div className="flex flex-col">
          <span className="font-black text-[#2B3674] text-sm">{val?.fullName || 'N/A'}</span>
          <span className="text-[10px] font-bold text-gray-400">{val?.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Thời gian</span>,
      dataIndex: 'createdAt',
      key: 'date',
      render: (text) => (
        <div className="flex flex-col">
          <span className="font-bold text-[#2B3674] text-xs">{dayjs(text).format('DD/MM/YYYY')}</span>
          <span className="text-[10px] text-gray-400">{dayjs(text).format('HH:mm')}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Số tiền</span>,
      dataIndex: 'totalPrice',
      key: 'total',
      render: (val) => <span className="font-black text-[#2B3674]">{(val || 0).toLocaleString()} ₫</span>,
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let bg, dot, text, textColor;
        switch (status) {
          case 'delivered':
            bg = 'bg-emerald-50'; dot = 'bg-emerald-500'; textColor = 'text-emerald-700'; text = 'Hoàn thành'; break;
          case 'pending':
            bg = 'bg-amber-50'; dot = 'bg-amber-500'; textColor = 'text-amber-700'; text = 'Chờ xử lý'; break;
          case 'processing':
            bg = 'bg-blue-50'; dot = 'bg-blue-500'; textColor = 'text-blue-700'; text = 'Đang chuẩn bị'; break;
          case 'shipping':
            bg = 'bg-purple-50'; dot = 'bg-purple-500'; textColor = 'text-purple-700'; text = 'Đang giao'; break;
          case 'cancelled':
            bg = 'bg-rose-50'; dot = 'bg-rose-500'; textColor = 'text-rose-700'; text = 'Đã hủy'; break;
          case 'confirmed':
            bg = 'bg-cyan-50'; dot = 'bg-cyan-500'; textColor = 'text-cyan-700'; text = 'Đã xác nhận'; break;
          default:
            bg = 'bg-gray-50'; dot = 'bg-gray-500'; textColor = 'text-gray-700'; text = status;
        }
        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg} ${textColor} border border-transparent`}>
            <span className={`w-2 h-2 rounded-full ${dot}`}></span>
            <span className="text-[11px] font-black uppercase tracking-wider">{text}</span>
          </div>
        );
      },
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Thao tác</span>,
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Dropdown 
          menu={{ items: [
            { key: 'view', label: <span className="font-bold">Xem chi tiết</span>, icon: <EyeOutlined className="text-blue-500" />, onClick: () => showDetail(record) },
            { 
              key: 'status_menu', 
              label: <span className="font-bold">Cập nhật trạng thái</span>, 
              icon: <ClockCircleOutlined className="text-amber-500" />,
              children: [
                { key: 'confirmed', label: 'Xác nhận', onClick: () => handleUpdateStatus(record._id, 'confirmed') },
                { key: 'processing', label: 'Chuẩn bị', onClick: () => handleUpdateStatus(record._id, 'processing') },
                { key: 'shipping', label: 'Giao hàng', onClick: () => handleUpdateStatus(record._id, 'shipping') },
                { key: 'delivered', label: 'Đã giao', onClick: () => handleUpdateStatus(record._id, 'delivered') },
                { key: 'cancelled', label: 'Hủy đơn', danger: true, onClick: () => handleUpdateStatus(record._id, 'cancelled') }
              ]
            },
            { type: 'divider' },
            { 
              key: 'push_ghn', 
              label: <span className="font-bold text-orange-600">Đẩy đơn GHN</span>, 
              icon: <CarOutlined className="text-orange-500" />, 
              onClick: () => handleCreateShipment(record._id) 
            }
          ] }} 
          trigger={['click']}
          placement="bottomRight"
          arrow
        >
          <Button type="text" className="hover:bg-blue-50 rounded-xl" icon={<MoreOutlined className="text-gray-400 text-lg" />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header Title & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2">
        <h3 className="text-2xl font-black text-[#2B3674] m-0 tracking-tighter"></h3>
        
        <div className="flex gap-4">
          <Button icon={<ExportOutlined />} className="bg-[#F4F7FE] border-none text-gray-600 font-black uppercase tracking-widest text-[10px] rounded-2xl h-12 px-6 hover:bg-blue-50 hover:text-blue-600 transition-all">Xuất dữ liệu</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-blue-600 h-12 px-8 rounded-2xl font-black shadow-lg shadow-blue-100 border-none hover:bg-blue-500 transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest text-xs">Tạo vận đơn</Button>
        </div>
      </div>

      {/* --- BẢNG THỐNG KÊ --- */}
      <div className="flex justify-between items-center mb-6 px-2">
        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest m-0">Tổng quan vận hành</h4>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian:</span>
           <Select 
             value={statsPeriod} 
             onChange={setStatsPeriod}
             variant="borderless"
             className="bg-[#F4F7FE] rounded-xl text-[11px] font-black uppercase tracking-widest text-blue-600 min-w-[140px]"
             dropdownClassName="premium-select-dropdown"
           >
             <Option value="all">Tất cả thời gian</Option>
             <Option value="today">Hôm nay</Option>
             <Option value="yesterday">Hôm qua</Option>
             <Option value="week">7 ngày qua</Option>
             <Option value="month">30 ngày qua</Option>
           </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <OrderStatCard 
          title="Thông tin vận hành"
          icon={<InboxOutlined />}
          options={[
            { label: 'Tất cả', value: stats.total },
            { label: 'Chờ xử lý', value: stats.pending },
            { label: 'Hoàn thành', value: stats.delivered },
          ]}
        />
        <OrderStatCard 
          title="Rủi ro vận chuyển"
          icon={<StopOutlined />}
          options={[
            { label: 'Đã hủy', value: stats.cancelled },
            { label: 'Hoàn trả', value: stats.returned },
          ]}
        />
        <OrderStatCard 
          title="Luồng mua hàng"
          icon={<ShoppingCartOutlined />}
          options={[
            { label: 'Bỏ quên giỏ', value: stats.abandoned },
            { label: 'Khách mua', value: stats.customers },
          ]}
        />
      </div>

      {/* --- MAIN CARD: FILTER & TABLE --- */}
      <div className="bg-white p-8 rounded-[32px] shadow-premium border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap gap-4 mb-8 justify-between items-center relative z-10">
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
               <div className="relative group">
                  <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-20" />
                  <Input 
                    placeholder="Tìm theo mã vận đơn..." 
                    className="w-full sm:w-[280px] h-[48px] rounded-2xl border-none bg-[#F4F7FE] pl-11 pr-4 font-bold text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
               </div>
               <Select 
                 value={statusFilter} 
                 onChange={setStatusFilter}
                 className="h-[48px] w-[180px] premium-select" 
               >
                 <Option value="all">Tất cả trạng thái</Option>
                 <Option value="pending">Chờ xử lý</Option>
                 <Option value="confirmed">Đã xác nhận</Option>
                 <Option value="processing">Đang chuẩn bị</Option>
                 <Option value="shipping">Đang giao</Option>
                 <Option value="delivered">Đã giao</Option>
                 <Option value="cancelled">Đã hủy</Option>
               </Select>
               <RangePicker className="h-[48px] border-none bg-[#F4F7FE] rounded-2xl font-bold text-sm px-4 shadow-sm" />
            </div>
            
            <Button icon={<FilterOutlined />} className="rounded-2xl h-[48px] px-6 font-bold text-gray-500 bg-[#F4F7FE] border-none hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2">
               Bộ lọc
               {(statusFilter !== 'all') && <Badge dot status="processing" className="ml-1" />}
            </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={dataSource} 
          pagination={{
            ...pagination,
            className: "premium-pagination",
          }}
          loading={loading}
          onChange={(p) => fetchOrders(p.current, p.pageSize)}
          className="premium-admin-table" 
          rowKey="_id"
          rowClassName="group hover:bg-blue-50/20 transition-colors cursor-pointer"
        />
      </div>

      <CreateOrderModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={() => {}} />
      <ViewOrderDetailDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} order={selectedOrder} />
    </div>
  );
};

export default OrderPage;