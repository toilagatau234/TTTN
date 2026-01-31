import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, Dropdown, Menu, message, Avatar } from 'antd';
import { 
  PlusOutlined, SearchOutlined, FilterOutlined, 
  MoreOutlined, EditOutlined, DeleteOutlined, 
  AppstoreOutlined, TagsOutlined, FolderOpenOutlined 
} from '@ant-design/icons';

import CreateCategoryModal from './components/CreateCategoryModal';

const { Option } = Select;

// Widget Thống kê (Reusable)
const CategoryStatCard = ({ icon, title, value, color }) => (
  <div className="bg-white p-5 rounded-[20px] shadow-sm flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-navy-700">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>
      {icon}
    </div>
  </div>
);

const CategoryPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dữ liệu giả lập
  const [data, setData] = useState([
    {
      key: '1',
      id: 1,
      name: 'Hoa Hồng (Roses)',
      description: 'Biểu tượng của tình yêu và lãng mạn',
      count: 156,
      status: 'Active',
      icon: 'https://images.unsplash.com/photo-1548507204-6d9b439c2e1e?auto=format&fit=crop&w=100&q=80',
      createdAt: '12/01/2025'
    },
    {
      key: '2',
      id: 2,
      name: 'Hoa Lan (Orchids)',
      description: 'Vẻ đẹp sang trọng và quý phái',
      count: 85,
      status: 'Active',
      icon: 'https://images.unsplash.com/photo-1566929369-1c255c5e0682?auto=format&fit=crop&w=100&q=80',
      createdAt: '15/01/2025'
    },
    {
      key: '3',
      id: 3,
      name: 'Hoa Cưới (Wedding)',
      description: 'Dành cho ngày trọng đại nhất',
      count: 42,
      status: 'Hidden',
      icon: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=100&q=80',
      createdAt: '20/01/2025'
    }
  ]);

  const handleCreate = (newItem) => {
    setData([newItem, ...data]);
    setIsModalOpen(false);
  };

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('Đã xóa danh mục');
  };

  const columns = [
    {
      title: 'TÊN DANH MỤC',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.icon} shape="square" size={48} className="rounded-lg shadow-sm" />
          <div>
            <h5 className="font-bold text-navy-700 text-sm m-0">{text}</h5>
            <span className="text-gray-400 text-xs">ID: {record.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'MÔ TẢ',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <span className="text-gray-500 line-clamp-1 max-w-[200px]">{text}</span>,
    },
    {
      title: 'SỐ SẢN PHẨM',
      dataIndex: 'count',
      key: 'count',
      render: (count) => (
        <Tag color="cyan" className="rounded-md font-bold px-2">
           {count} sản phẩm
        </Tag>
      ),
    },
    {
      title: 'NGÀY TẠO',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className="text-gray-500 font-medium">{date}</span>,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'default'} className="rounded-md font-medium">
          {status === 'Active' ? 'Hiển thị' : 'Đã ẩn'}
        </Tag>
      ),
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
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-500 h-10 px-6 rounded-xl font-medium shadow-brand-500/50 border-none hover:bg-brand-600"
        >
          Thêm danh mục
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
         <CategoryStatCard title="Tổng Danh Mục" value={data.length} icon={<AppstoreOutlined />} color="bg-light-primary text-brand-500" />
         <CategoryStatCard title="Đang Hoạt Động" value={data.filter(c => c.status === 'Active').length} icon={<TagsOutlined />} color="bg-green-50 text-green-500" />
         <CategoryStatCard title="Tổng Sản Phẩm" value="1,405" icon={<FolderOpenOutlined />} color="bg-blue-50 text-blue-500" />
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
        <div className="flex flex-wrap gap-4 mb-6 justify-between">
           <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm danh mục..." className="w-[250px] rounded-xl border-none bg-[#F4F7FE] h-[40px]" />
              <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl" bordered={false}>
                 <Option value="all">Tất cả trạng thái</Option>
                 <Option value="active">Hiển thị</Option>
                 <Option value="hidden">Đã ẩn</Option>
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

      <CreateCategoryModal 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onCreate={handleCreate} 
      />
    </div>
  );
};

export default CategoryPage;