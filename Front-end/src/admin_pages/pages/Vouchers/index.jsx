import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Dropdown, Menu, message, Progress } from 'antd';
import { 
  PlusOutlined, SearchOutlined, FilterOutlined, 
  MoreOutlined, EditOutlined, DeleteOutlined, 
  BarcodeOutlined, CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';

import CreateVoucherModal from './components/CreateVoucherModal';
import UpdateVoucherModal from './components/UpdateVoucherModal';
import voucherService from '../../../services/voucherService';

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Filters State
  const [searchCode, setSearchCode] = useState('');
  const [debouncedSearchCode, setDebouncedSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await voucherService.getAll({
        code: debouncedSearchCode,
        isActive: statusFilter
      });
      if (response && response.success) {
        setData(response.data.map(v => ({ ...v, key: v._id })));
      }
    } catch (error) {
      message.error('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search code
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchCode(searchCode);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchCode]);

  useEffect(() => {
    fetchVouchers();
  }, [debouncedSearchCode, statusFilter]);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchVouchers();
  };

  const handleUpdate = async (id, payload) => {
    try {
      const response = await voucherService.update(id, payload);
      if (response && response.success) {
        setIsUpdateModalOpen(false);
        fetchVouchers();
      }
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const handleDelete = async (id) => {
    try {
      await voucherService.delete(id);
      message.success('Đã xóa mã giảm giá');
      fetchVouchers();
    } catch (error) {
      message.error('Xóa thất bại');
    }
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
          <div className="text-gray-500 text-xs mt-1">{record.description || 'Không có mô tả'}</div>
        </div>
      ),
    },
    {
      title: 'GIÁ TRỊ GIẢM',
      key: 'value',
      render: (_, record) => (
        <div>
           <span className="font-bold text-navy-700 text-lg">
             {record.discountType === 'percent' ? `${record.discountValue}%` : `${record.discountValue?.toLocaleString()} đ`}
           </span>
           {record.discountType === 'percent' && (
             <div className="text-xs text-gray-400">Tối đa: {record.maxDiscount ? `${record.maxDiscount.toLocaleString()} đ` : 'Vô hạn'}</div>
           )}
           <div className="text-xs text-gray-400">Đơn từ: {record.minOrderValue?.toLocaleString()} đ</div>
        </div>
      ),
    },
    {
      title: 'LƯỢT DÙNG',
      key: 'usage',
      width: 200,
      render: (_, record) => {
        const limit = record.usageLimit || 1000;
        const used = record.usedCount || 0;
        const percent = Math.min(100, Math.round((used / limit) * 100));
        return (
          <div className="w-full">
            <div className="flex justify-between mb-1 text-xs">
               <span className="text-gray-500">{used}/{record.usageLimit || '∞'}</span>
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
           <div>{record.startDate ? new Date(record.startDate).toLocaleDateString('vi-VN') : '-'}</div>
           <div>↓</div>
           <div>{record.endDate ? new Date(record.endDate).toLocaleDateString('vi-VN') : '-'}</div>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      key: 'status',
      render: (_, record) => {
        const now = new Date();
        const start = new Date(record.startDate);
        const end = new Date(record.endDate);
        const isValid = record.isActive && now >= start && now <= end && (record.usageLimit === null || (record.usedCount || 0) < record.usageLimit);

        let color = isValid ? 'green' : 'default';
        let icon = isValid ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
        let text = isValid ? 'Đang chạy' : 'Không sử dụng';
        
        if (!record.isActive) text = 'Tắt';
        else if (now < start) text = 'Chưa bắt đầu';
        else if (now > end) text = 'Hết hạn';
        else if (record.usageLimit !== null && (record.usedCount || 0) >= record.usageLimit) text = 'Hết lượt';

        return <Tag icon={icon} color={color} className="rounded-md font-medium px-2 py-1">{text}</Tag>;
      },
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Dropdown 
          menu={{ items: [
            { 
              key: '1', 
              label: 'Chỉnh sửa', 
              icon: <EditOutlined />,
              onClick: () => {
                setSelectedVoucher(record);
                setIsUpdateModalOpen(true);
              }
            },
            { key: '2', label: record.isActive ? 'Tắt mã' : 'Bật mã', icon: <ClockCircleOutlined />, onClick: () => handleUpdate(record._id, { isActive: !record.isActive }) },
            { key: '3', label: 'Xóa mã', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record._id) }
          ] }} 
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
         <VoucherStatCard title="Đang hoạt động" value={data.filter(i => {
           const now = new Date();
           return i.isActive && new Date(i.startDate) <= now && new Date(i.endDate) >= now;
         }).length} icon={<BarcodeOutlined />} color="bg-light-primary text-brand-500" />
         <VoucherStatCard title="Tổng lượt dùng" value={data.reduce((sum, item) => sum + (item.usedCount || 0), 0)} icon={<CheckCircleOutlined />} color="bg-green-50 text-green-500" />
         <VoucherStatCard title="Tổng mã" value={data.length} icon={<ClockCircleOutlined />} color="bg-gray-100 text-gray-500" />
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
         <div className="flex justify-between mb-4">
            <div className="flex gap-3">
                <Input 
                  prefix={<SearchOutlined className="text-gray-400" />} 
                  placeholder="Tìm mã code..." 
                  className="w-[250px] rounded-xl h-[40px] border-none bg-[#F4F7FE]" 
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  allowClear
                />
                <Select 
                  value={statusFilter} 
                  onChange={setStatusFilter}
                  className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl"
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="active">Đang chạy</Option>
                </Select>
            </div>
            <Button icon={<FilterOutlined />} className="rounded-xl h-[40px] text-gray-500">Lọc</Button>
         </div>
         <Table columns={columns} dataSource={data} pagination={{ pageSize: 6 }} loading={loading} className="custom-table-metrix" />
      </div>

      <CreateVoucherModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreateSuccess} />
      <UpdateVoucherModal open={isUpdateModalOpen} onCancel={() => setIsUpdateModalOpen(false)} onUpdate={handleUpdate} voucher={selectedVoucher} />
    </div>
  );
};

export default VoucherPage;