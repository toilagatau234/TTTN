import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, Avatar, Dropdown, Menu, message } from 'antd';
import { 
  PlusOutlined, SearchOutlined, MoreOutlined, 
  EditOutlined, StopOutlined, DeleteOutlined, 
  UserSwitchOutlined, TeamOutlined, MailOutlined
} from '@ant-design/icons';

import CreateStaffModal from './components/CreateStaffModal';

const { Option } = Select;

const StaffPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dữ liệu giả lập ban đầu
  const [data, setData] = useState([
    {
      key: '1', id: 'STF-001', name: 'Trần Quản Lý', email: 'manager@flower.shop', phone: '0912345678',
      role: 'Manager', department: 'Ban Giám Đốc', status: 'Active',
      avatar: 'https://i.pravatar.cc/150?img=68', joinDate: '01/01/2024', lastActive: 'Vừa xong'
    },
    {
      key: '2', id: 'STF-002', name: 'Lê Thủ Kho', email: 'kho@flower.shop', phone: '0987654321',
      role: 'Warehouse', department: 'Kho vận', status: 'Active',
      avatar: 'https://i.pravatar.cc/150?img=12', joinDate: '15/05/2024', lastActive: '5 phút trước'
    },
    {
      key: '3', id: 'STF-003', name: 'Nguyễn Sale', email: 'sale1@flower.shop', phone: '0909090909',
      role: 'Sale', department: 'Kinh doanh', status: 'Blocked',
      avatar: 'https://i.pravatar.cc/150?img=32', joinDate: '20/10/2024', lastActive: '3 ngày trước'
    },
  ]);

  const handleCreate = (newItem) => {
    setData([newItem, ...data]);
    setIsModalOpen(false);
  };

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('Đã xóa nhân viên');
  };

  const columns = [
    {
      title: 'NHÂN SỰ',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} size={44} shape="square" className="rounded-xl border border-gray-100" />
          <div>
            <h5 className="font-bold text-navy-700 text-sm m-0">{text}</h5>
            <div className="flex items-center text-gray-400 text-xs gap-1 mt-0.5">
               <MailOutlined /> {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'VAI TRÒ & BỘ PHẬN',
      key: 'role',
      render: (_, record) => (
        <div>
           {/* Logic màu sắc cho từng Role */}
           <Tag color={record.role === 'Admin' ? 'red' : (record.role === 'Manager' ? 'purple' : (record.role === 'Warehouse' ? 'orange' : 'blue'))} className="font-bold border-0">
              {record.role}
           </Tag>
           <div className="text-xs text-gray-500 mt-1 pl-1 font-medium">{record.department}</div>
        </div>
      )
    },
    {
      title: 'HOẠT ĐỘNG',
      dataIndex: 'lastActive',
      render: (val) => <span className="text-gray-500 text-sm">{val}</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      render: (status) => (
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
           <span className={`font-medium text-sm ${status === 'Active' ? 'text-green-700' : 'text-red-700'}`}>
             {status === 'Active' ? 'Active' : 'Blocked'}
           </span>
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Dropdown 
          overlay={
            <Menu items={[
              { key: '1', label: 'Sửa hồ sơ', icon: <EditOutlined /> },
              { key: '2', label: 'Phân quyền', icon: <UserSwitchOutlined /> },
              { key: '3', label: 'Khóa tài khoản', icon: <StopOutlined />, danger: true },
              { key: '4', label: 'Xóa nhân sự', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.key) },
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
        
        <div className="flex gap-3">
           <div className="hidden md:flex items-center bg-white px-4 py-2 rounded-xl shadow-sm gap-2">
              <TeamOutlined className="text-brand-500 text-lg" />
              <span className="text-gray-500 text-sm font-medium">Tổng: <strong className="text-navy-700">{data.length}</strong></span>
           </div>
           <Button 
             type="primary" 
             icon={<PlusOutlined />} 
             onClick={() => setIsModalOpen(true)}
             className="bg-brand-500 h-10 px-6 rounded-xl font-bold shadow-brand-500/50 border-none hover:bg-brand-600"
           >
             Thêm Nhân Viên
           </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
         <div className="flex flex-wrap gap-4 mb-6 justify-between">
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
               <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm tên, email..." className="w-[250px] rounded-xl h-[40px] bg-[#F4F7FE] border-none" />
               <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl" bordered={false}>
                 <Option value="all">Tất cả bộ phận</Option>
                 <Option value="sale">Kinh doanh</Option>
                 <Option value="warehouse">Kho vận</Option>
               </Select>
            </div>
         </div>
         <Table columns={columns} dataSource={data} pagination={{ pageSize: 6 }} className="custom-table-metrix" />
      </div>

      <CreateStaffModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default StaffPage;