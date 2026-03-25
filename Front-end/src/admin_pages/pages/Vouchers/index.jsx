import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Dropdown, Menu, message, Progress } from 'antd';
import { 
  PlusOutlined, SearchOutlined, FilterOutlined, 
  MoreOutlined, EditOutlined, DeleteOutlined, 
  BarcodeOutlined, CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

import CreateVoucherModal from './components/CreateVoucherModal';
import UpdateVoucherModal from './components/UpdateVoucherModal';
import voucherService from '../../../services/voucherService';

const { Option } = Select;

// Widget Thống kê
const VoucherStatCard = ({ icon, title, value, sub, colorClass }) => (
  <div className="bg-white p-6 rounded-[24px] shadow-premium flex items-center justify-between border border-white/50 relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none"></div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-[#2B3674] tracking-tighter m-0">{value}</h3>
      {sub && <p className="text-[11px] text-emerald-500 font-bold mt-1 uppercase tracking-tight">{sub}</p>}
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
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
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Mã Voucher</span>,
      dataIndex: 'code',
      key: 'code',
      render: (text, record) => (
        <div className="flex flex-col gap-2 py-2 pl-2">
          <div className="flex items-center">
            <span className="font-black text-blue-600 text-sm border-2 border-dashed border-blue-200 rounded-xl px-4 py-1.5 bg-blue-50/50 tracking-widest group-hover:scale-105 transition-transform duration-300">
              {text}
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-400 line-clamp-1">{record.description || 'Chương trình ưu đãi hiện hành'}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Chiết khấu</span>,
      key: 'value',
      render: (_, record) => (
        <div className="flex flex-col">
           <span className="font-black text-[#2B3674] text-lg tracking-tighter">
             {record.discountType === 'percent' ? `${record.discountValue}%` : `${record.discountValue?.toLocaleString()} đ`}
           </span>
           <div className="flex items-center gap-1 mt-1">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded-md">
               Min: {record.minOrderValue?.toLocaleString()} đ
             </span>
             {record.discountType === 'percent' && record.maxDiscount && (
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded-md">
                 Max: {record.maxDiscount.toLocaleString()} đ
               </span>
             )}
           </div>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Độ phủ (Usage)</span>,
      key: 'usage',
      width: 180,
      render: (_, record) => {
        const limit = record.usageLimit || 0;
        const used = record.usedCount || 0;
        const isUnlimited = !limit || limit === 0;
        const percent = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
        
        return (
          <div className="w-full max-w-[140px]">
            <div className="flex justify-between mb-1.5 px-0.5">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 {used} / {isUnlimited ? '∞' : limit}
               </span>
               {!isUnlimited && <span className="text-[10px] font-black text-blue-600">{percent}%</span>}
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full rounded-full transition-all duration-1000 ${percent >= 90 ? 'bg-rose-500' : 'bg-blue-600'}`}
                 style={{ width: `${isUnlimited ? (used > 0 ? 100 : 0) : percent}%` }}
               ></div>
            </div>
          </div>
        );
      }
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Thời hạn</span>,
      key: 'time',
      render: (_, record) => (
        <div className="flex flex-col gap-1">
           <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
             <span className="text-[10px] font-black text-[#2B3674] tracking-tight">{record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : 'Vô thời hạn'}</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
             <span className="text-[10px] font-black text-[#2B3674] tracking-tight">{record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : 'Vô thời hạn'}</span>
           </div>
        </div>
      )
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</span>,
      key: 'status',
      render: (_, record) => {
        const now = new Date();
        const start = record.startDate ? new Date(record.startDate) : null;
        const end = record.endDate ? new Date(record.endDate) : null;
        
        let bg, dot, text, textColor;

        if (!record.isActive) {
          bg = 'bg-gray-50'; dot = 'bg-gray-500'; textColor = 'text-gray-700'; text = 'Vô hiệu';
        } else if (start && now < start) {
          bg = 'bg-blue-50'; dot = 'bg-blue-500'; textColor = 'text-blue-700'; text = 'Chờ chạy';
        } else if (end && now > end) {
          bg = 'bg-rose-50'; dot = 'bg-rose-500'; textColor = 'text-rose-700'; text = 'Hết hạn';
        } else if (record.usageLimit && record.usedCount >= record.usageLimit) {
          bg = 'bg-amber-50'; dot = 'bg-amber-500'; textColor = 'text-amber-700'; text = 'Hết lượt';
        } else {
          bg = 'bg-emerald-50'; dot = 'bg-emerald-500'; textColor = 'text-emerald-700'; text = 'Đang chạy';
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
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</span>,
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Dropdown 
          menu={{ items: [
            { 
              key: 'edit', 
              label: <span className="font-bold">Chỉnh sửa</span>, 
              icon: <EditOutlined className="text-amber-500" />,
              onClick: () => {
                setSelectedVoucher(record);
                setIsUpdateModalOpen(true);
              }
            },
            { 
              key: 'toggle', 
              label: <span className="font-bold">{record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt lại'}</span>, 
              icon: <ClockCircleOutlined className={record.isActive ? "text-rose-500" : "text-emerald-500"} />, 
              onClick: () => handleUpdate(record._id, { isActive: !record.isActive }) 
            },
            { type: 'divider' },
            { 
              key: 'delete', 
              label: <span className="font-bold">Xóa Voucher</span>, 
              icon: <DeleteOutlined />, 
              danger: true, 
              onClick: () => handleDelete(record._id) 
            }
          ] }} 
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
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2">
        <h3 className="text-2xl font-black text-[#2B3674] m-0 tracking-tighter">Quản lý Voucher</h3>
        
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 h-12 px-8 rounded-2xl font-black shadow-lg shadow-blue-100 border-none hover:bg-blue-500 transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest text-xs"
        >
          Tạo mã giảm giá mới
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <VoucherStatCard 
           title="Đang hoạt động" 
           value={data.filter(i => {
             const now = new Date();
             const start = i.startDate ? new Date(i.startDate) : null;
             const end = i.endDate ? new Date(i.endDate) : null;
             const isOutOfLimit = i.usageLimit && i.usedCount >= i.usageLimit;
             return i.isActive && (!start || now >= start) && (!end || now <= end) && !isOutOfLimit;
           }).length} 
           icon={<BarcodeOutlined />} 
           colorClass="bg-[#F4F7FE] text-blue-600" 
         />
         <VoucherStatCard 
           title="Tổng lượt sử dụng" 
           value={data.reduce((sum, item) => sum + (item.usedCount || 0), 0)} 
           icon={<CheckCircleOutlined />} 
           colorClass="bg-emerald-50 text-emerald-500" 
           sub="Tăng 8% so với tuần trước"
         />
         <VoucherStatCard 
           title="Hạn mức phát hành" 
           value={data.length} 
           icon={<ClockCircleOutlined />} 
           colorClass="bg-amber-50 text-amber-500" 
         />
      </div>

      {/* Main Container: Filter & Table */}
      <div className="bg-white p-8 rounded-[32px] shadow-premium border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>

         <div className="flex flex-wrap gap-4 mb-8 justify-between items-center relative z-10">
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
               <div className="relative group">
                  <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-20" />
                  <Input 
                    placeholder="Tìm theo mã code sản phẩm..." 
                    className="w-full sm:w-[320px] h-[48px] rounded-2xl border-none bg-[#F4F7FE] pl-11 pr-4 font-bold text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" 
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    allowClear
                  />
               </div>
               <Select 
                 value={statusFilter} 
                 onChange={setStatusFilter}
                 className="h-[48px] w-[180px] premium-select"
               >
                 <Option value="all">Tất cả trạng thái</Option>
                 <Option value="active">Đang áp dụng</Option>
               </Select>
            </div>
            
            <Button icon={<FilterOutlined />} className="rounded-2xl h-[48px] px-6 font-bold text-gray-500 bg-[#F4F7FE] border-none hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2">
               Bộ lọc nâng cao
               {(statusFilter !== 'all') && <Badge dot status="processing" className="ml-1" />}
            </Button>
         </div>

         <Table 
           columns={columns} 
           dataSource={data} 
           pagination={{ 
             pageSize: 6,
             className: "premium-pagination"
           }} 
           loading={loading} 
           className="premium-admin-table" 
           rowClassName="group hover:bg-blue-50/20 transition-colors cursor-pointer"
         />
      </div>

      <CreateVoucherModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreateSuccess} />
      <UpdateVoucherModal open={isUpdateModalOpen} onCancel={() => setIsUpdateModalOpen(false)} onUpdate={handleUpdate} voucher={selectedVoucher} />
    </div>
  );
};

export default VoucherPage;