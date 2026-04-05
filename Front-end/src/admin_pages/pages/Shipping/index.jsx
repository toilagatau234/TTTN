import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Tabs, Tooltip, message } from 'antd';
import { 
  SearchOutlined, ReloadOutlined, CarOutlined, 
  EnvironmentOutlined, FilePdfOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import shippingService from '../../../services/shippingService';

const { Option } = Select;

const ShippingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchShipments = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await shippingService.getShipments({ page, limit: pageSize });
      if (res.success) {
         setShipments(res.data.map(item => ({
            key: item._id,
            id: item.trackingCode || item._id.slice(-6),
            orderId: item.order?.orderCode || 'N/A',
            carrier: item.carrier?.name || 'Vận chuyển',
            status: item.status,
            fee: item.shippingFee || 0,
            cod: item.order?.paymentMethod === 'cod' ? item.order?.totalPrice : 0,
            createdAt: item.createdAt,
            customer: item.order?.shippingInfo?.fullName || 'N/A'
         })));
         setPagination({ current: res.pagination.page, pageSize: res.pagination.limit, total: res.pagination.total });
      }
    } catch (err) {
      message.error('Lỗi tải danh sách vận đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments(1, 10);
  }, []);

  const handleSync = () => {
    fetchShipments(1, pagination.pageSize);
    message.success('Đã làm mới danh sách vận đơn!');
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
          created: { color: 'cyan', text: 'Mới tạo / Chờ lấy hàng' },
          picked_up: { color: 'blue', text: 'Đã lấy hàng' },
          in_transit: { color: 'processing', text: 'Đang luân chuyển' },
          delivering: { color: 'processing', text: 'Đang giao' },
          delivered: { color: 'success', text: 'Giao thành công' },
          returned: { color: 'error', text: 'Đang hoàn trả' },
          failed: { color: 'error', text: 'Thất bại' },
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
            pagination={{ ...pagination, onChange: (page, pageSize) => fetchShipments(page, pageSize) }} 
            loading={loading}
            className="custom-table-metrix" 
            rowClassName="hover:bg-blue-50/20 transition-colors"
         />
      </div>
    </div>
  );
};

export default ShippingPage;