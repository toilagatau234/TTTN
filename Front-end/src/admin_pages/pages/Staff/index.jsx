import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Avatar, Dropdown, Menu, message } from 'antd';
import userService from '../../../services/userService';
import { 
  PlusOutlined, SearchOutlined, MoreOutlined, 
  EditOutlined, StopOutlined, DeleteOutlined, 
  UserSwitchOutlined, TeamOutlined, MailOutlined
} from '@ant-design/icons';

import CreateStaffModal from './components/CreateStaffModal';
import EditStaffModal from './components/EditStaffModal';

const { Option } = Select;

const StaffPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditStaff, setCurrentEditStaff] = useState(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchStaff();
  }, [search, departmentFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll({ 
        type: 'staff', 
        search: search || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined
      });
      if (response.success) {
        const mappedData = response.data.map(item => ({
          ...item,
          key: item._id
        }));
        setData(mappedData);
      }
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (newItem) => {
    fetchStaff();
    setIsModalOpen(false);
  };

  const handleEditClick = (record) => {
    setCurrentEditStaff(record);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (updatedItem) => {
    fetchStaff();
    setIsEditModalOpen(false);
    setCurrentEditStaff(null);
  };

  const handleDelete = async (id) => {
    try {
      await userService.delete(id);
      setData(data.filter(item => item._id !== id));
      message.success('Đã xóa nhân viên');
    } catch (error) {
      message.error('Không thể xóa nhân viên');
    }
  };

  const handleBlock = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
      await userService.update(id, { status: newStatus });
      setData(data.map(item => item._id === id ? { ...item, status: newStatus } : item));
      message.success(newStatus === 'Active' ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const columns = [
    {
      title: 'NHÂN SỰ',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar || null} size={44} shape="square" className="rounded-xl border border-gray-100" />
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
          menu={{
            items: [
              { key: '1', label: 'Sửa hồ sơ', icon: <EditOutlined />, onClick: () => handleEditClick(record) },
              { key: '3', label: record.status === 'Active' ? 'Khóa tài khoản' : 'Kích hoạt', icon: <StopOutlined />, danger: record.status === 'Active', onClick: () => handleBlock(record._id, record.status) },
              { key: '4', label: 'Xóa nhân sự', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record._id) },
            ]
          }}
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
               <Input 
                 prefix={<SearchOutlined className="text-gray-400" />} 
                 placeholder="Tìm tên, email..." 
                 className="w-[250px] rounded-xl h-[40px] bg-[#F4F7FE] border-none" 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
               <Select 
                 value={departmentFilter} 
                 className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl" 
                 variant="bordered"
                 onChange={value => setDepartmentFilter(value)}
               >
                  <Option value="all">Tất cả bộ phận</Option>
                  <Option value="Kinh doanh">Kinh doanh</Option>
                  <Option value="Kho vận">Kho vận</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="CSKH">CSKH</Option>
                  <Option value="Kế toán">Kế toán</Option>
                  <Option value="Hành chính">Hành chính Nhân sự</Option>
                  <Option value="Ban Giám Đốc">Ban Giám Đốc</Option>
               </Select>
            </div>
         </div>
         <Table columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 6 }} className="custom-table-metrix" />
      </div>

      <CreateStaffModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
      <EditStaffModal open={isEditModalOpen} onCancel={() => { setIsEditModalOpen(false); setCurrentEditStaff(null); }} onUpdate={handleUpdate} staff={currentEditStaff} />
    </div>
  );
};

export default StaffPage;