import React, { useState } from 'react';
import { Table, Tag, Avatar, Input, Select, DatePicker, Button, Card, Modal, message } from 'antd';
import { 
  SearchOutlined, 
  HistoryOutlined, 
  DeleteOutlined, 
  FilterOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ActivityLogsPage = () => {
  const [loading, setLoading] = useState(false);

  // Dữ liệu giả lập (Mock Data)
  const [logs, setLogs] = useState([
    {
      key: '1',
      id: 101,
      user: { name: 'Trần Quản Lý', avatar: 'https://i.pravatar.cc/150?img=68', role: 'Manager' },
      action: 'UPDATE',
      target: 'Sản phẩm #PROD-102',
      detail: 'Cập nhật giá bán từ 500,000đ -> 550,000đ',
      ip: '192.168.1.15',
      time: '10:30 31/01/2026'
    },
    {
      key: '2',
      id: 102,
      user: { name: 'Lê Thủ Kho', avatar: 'https://i.pravatar.cc/150?img=12', role: 'Warehouse' },
      action: 'CREATE',
      target: 'Phiếu nhập #IMP-005',
      detail: 'Tạo phiếu nhập hàng mới từ Hasfarm',
      ip: '192.168.1.20',
      time: '09:15 31/01/2026'
    },
    {
      key: '3',
      id: 103,
      user: { name: 'Admin User', avatar: 'https://i.pravatar.cc/150?img=3', role: 'Admin' },
      action: 'DELETE',
      target: 'Nhân viên #STF-009',
      detail: 'Xóa nhân viên Nguyễn Văn B ra khỏi hệ thống',
      ip: '113.161.x.x',
      time: '18:00 30/01/2026'
    },
    {
      key: '4',
      id: 104,
      user: { name: 'Nguyễn Sale', avatar: 'https://i.pravatar.cc/150?img=32', role: 'Sale' },
      action: 'LOGIN',
      target: 'Hệ thống',
      detail: 'Đăng nhập thành công',
      ip: '14.161.x.x',
      time: '08:00 30/01/2026'
    },
    {
      key: '5',
      id: 105,
      user: { name: 'Admin User', avatar: 'https://i.pravatar.cc/150?img=3', role: 'Admin' },
      action: 'EXPORT',
      target: 'Báo cáo doanh thu',
      detail: 'Xuất file Excel báo cáo tháng 1',
      ip: '113.161.x.x',
      time: '17:45 29/01/2026'
    },
  ]);

  // Hàm xử lý hành động (Action Type) ra màu sắc
  const getActionTag = (action) => {
    switch (action) {
      case 'CREATE': return <Tag color="green" className="font-bold">THÊM MỚI</Tag>;
      case 'UPDATE': return <Tag color="blue" className="font-bold">CẬP NHẬT</Tag>;
      case 'DELETE': return <Tag color="red" className="font-bold">XÓA BỎ</Tag>;
      case 'LOGIN': return <Tag color="gold" className="font-bold">ĐĂNG NHẬP</Tag>;
      case 'EXPORT': return <Tag color="purple" className="font-bold">XUẤT FILE</Tag>;
      default: return <Tag>{action}</Tag>;
    }
  };

  const handleClearLogs = () => {
    Modal.confirm({
      title: 'Xóa toàn bộ nhật ký?',
      content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa sạch lịch sử hoạt động không?',
      okText: 'Xóa ngay',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        setLogs([]);
        message.success('Đã xóa sạch nhật ký hệ thống');
      }
    });
  };

  const columns = [
    {
      title: 'NGƯỜI THỰC HIỆN',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-bold text-navy-700 text-sm">{user.name}</div>
            <div className="text-xs text-gray-400">{user.role}</div>
          </div>
        </div>
      )
    },
    {
      title: 'HÀNH ĐỘNG',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => getActionTag(action)
    },
    {
      title: 'ĐỐI TƯỢNG & CHI TIẾT',
      key: 'detail',
      render: (_, record) => (
        <div>
           <div className="font-bold text-navy-700 text-sm">{record.target}</div>
           <div className="text-gray-500 text-xs">{record.detail}</div>
        </div>
      )
    },
    {
      title: 'IP / THIẾT BỊ',
      dataIndex: 'ip',
      key: 'ip',
      render: (text) => <span className="text-gray-400 font-mono text-xs">{text}</span>
    },
    {
      title: 'THỜI GIAN',
      dataIndex: 'time',
      key: 'time',
      width: 180,
      render: (text) => <span className="text-gray-500 font-medium text-sm">{text}</span>
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-navy-700">Nhật Ký Hoạt Động</h2>
           <p className="text-gray-500 text-sm">Theo dõi mọi thay đổi trong hệ thống</p>
        </div>
        <div className="flex gap-2">
           <Button icon={<ReloadOutlined />} onClick={() => setLoading(true)}>Làm mới</Button>
           <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleClearLogs}>Xóa Lịch Sử</Button>
        </div>
      </div>

      <Card className="rounded-[20px] shadow-sm border-none p-0">
         {/* Filter Bar */}
         <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
               <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm theo tên NV, nội dung..." className="w-[250px] rounded-xl bg-[#F4F7FE] border-none h-[40px]" />
               <Select placeholder="Loại hành động" className="w-[160px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl" allowClear>
                  <Option value="CREATE">Thêm mới</Option>
                  <Option value="UPDATE">Cập nhật</Option>
                  <Option value="DELETE">Xóa</Option>
                  <Option value="LOGIN">Đăng nhập</Option>
               </Select>
               <RangePicker className="h-[40px] rounded-xl bg-[#F4F7FE] border-none" placeholder={['Từ ngày', 'Đến ngày']} />
            </div>
            <Button icon={<FilterOutlined />} type="dashed" className="h-[40px] rounded-xl text-gray-500">Bộ lọc nâng cao</Button>
         </div>

         {/* Table */}
         <Table 
            columns={columns} 
            dataSource={logs} 
            pagination={{ pageSize: 10 }} 
            className="custom-table-metrix"
            loading={loading}
         />
      </Card>
    </div>
  );
};

export default ActivityLogsPage;