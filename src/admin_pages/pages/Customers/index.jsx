import React, { useState } from 'react';
import { Table, Input, Button, Tag, Avatar, Select, Dropdown, Menu } from 'antd';
import { 
  SearchOutlined, PlusOutlined, FilterOutlined, UserOutlined, 
  MoreOutlined, EditOutlined, DeleteOutlined, StopOutlined, 
  CheckCircleOutlined, TeamOutlined, UserAddOutlined, CrownOutlined
} from '@ant-design/icons';

// IMPORT MODAL VỪA TẠO
import CreateCustomerModal from './components/CreateCustomerModal';

const { Option } = Select;

// Component Widget thống kê (giữ nguyên)
const CustomerStatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-5 rounded-[20px] shadow-sm flex items-center justify-between">
     <div>
       <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
       <h3 className="text-2xl font-bold text-navy-700">{value}</h3>
     </div>
     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>
        {icon}
     </div>
  </div>
);

const CustomersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dữ liệu mẫu ban đầu
  const [data, setData] = useState([
    { key: '1', id: 101, name: 'Nguyễn Quốc Anh', email: 'quocanh@gmail.com', role: 'Admin', status: 'Active', joinDate: '24/01/2025', avatar: 'https://i.pravatar.cc/150?img=11', spent: '12.500.000 ₫' },
    { key: '2', id: 102, name: 'Trần Phương Uyên', email: 'uyen.tran@gmail.com', role: 'User', status: 'Active', joinDate: '20/01/2025', avatar: 'https://i.pravatar.cc/150?img=5', spent: '550.000 ₫' },
  ]);

  // --- HÀM XỬ LÝ THÊM MỚI ---
  const handleCreate = (newCustomer) => {
    // Tạo cấu trúc dữ liệu khớp với bảng
    const newItem = {
      key: Date.now(), // Key duy nhất cho React
      ...newCustomer
    };
    
    // Cập nhật state bảng dữ liệu
    setData([newItem, ...data]); 
    
    // Đóng modal
    setIsModalOpen(false);
  };

  // Cấu hình cột (Giữ nguyên như cũ)
  const columns = [
    {
      title: 'THÀNH VIÊN',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} size={40} icon={<UserOutlined />} />
          <div>
            <h5 className="font-bold text-navy-700 text-sm m-0">{text}</h5>
            <span className="text-gray-400 text-xs">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'VAI TRÒ',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'Admin' ? 'purple' : 'blue'} className="rounded-md border-0 px-2 py-1 font-medium">
          {role === 'Admin' ? <CrownOutlined className="mr-1" /> : null}
          {role}
        </Tag>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <div className="flex items-center gap-2">
           {status === 'Active' ? <CheckCircleOutlined className="text-green-500" /> : <StopOutlined className="text-red-500" />}
           <span className={`font-bold text-sm ${status === 'Active' ? 'text-navy-700' : 'text-gray-400'}`}>
             {status === 'Active' ? 'Hoạt động' : 'Bị khóa'}
           </span>
        </div>
      ),
    },
    { title: 'NGÀY THAM GIA', dataIndex: 'joinDate', key: 'joinDate', render: (t) => <span className="font-medium text-gray-500">{t}</span> },
    { title: 'CHI TIÊU', dataIndex: 'spent', key: 'spent', render: (t) => <span className="font-bold text-brand-500">{t}</span> },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: () => (
        <Dropdown overlay={<Menu items={[{ key: '1', label: 'Sửa', icon: <EditOutlined /> }, { key: '2', label: 'Khóa', icon: <StopOutlined />, danger: true }]} />} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined className="text-gray-400" />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* <div>
           <h2 className="text-2xl font-bold text-navy-700">Quản lý Khách hàng</h2>
           <p className="text-gray-500 text-sm">Danh sách thành viên và quản trị viên</p>
        </div> */}
        
        {/* NÚT MỞ MODAL */}
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-500 h-10 px-6 rounded-xl font-medium shadow-brand-500/50 border-none"
        >
          Thêm mới
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
         <CustomerStatCard label="Tổng Thành Viên" value={data.length} icon={<TeamOutlined />} color="bg-light-primary text-brand-500" />
         <CustomerStatCard label="Thành Viên Mới" value="+5" icon={<UserAddOutlined />} color="bg-green-50 text-green-500" />
         <CustomerStatCard label="Đang Hoạt Động" value={data.filter(u => u.status === 'Active').length} icon={<CheckCircleOutlined />} color="bg-blue-50 text-blue-500" />
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
        <div className="flex flex-wrap gap-4 mb-6 justify-between items-center">
           <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm kiếm..." className="w-full md:w-[250px] h-[40px] rounded-xl border-none bg-[#F4F7FE]" />
              <Select defaultValue="all" className="h-[40px] w-[140px] custom-select-borderless bg-[#F4F7FE] rounded-xl" bordered={false}>
                 <Option value="all">Tất cả Vai trò</Option>
                 <Option value="Admin">Admin</Option>
                 <Option value="User">User</Option>
              </Select>
           </div>
           <Button icon={<FilterOutlined />} className="border-gray-200 text-gray-500 rounded-xl h-[40px]">Bộ lọc</Button>
        </div>

        <Table columns={columns} dataSource={data} pagination={{ pageSize: 6 }} className="custom-table-metrix" />
      </div>

      {/* MODAL COMPONENT */}
      <CreateCustomerModal 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onCreate={handleCreate} 
      />
    </div>
  );
};

export default CustomersPage;