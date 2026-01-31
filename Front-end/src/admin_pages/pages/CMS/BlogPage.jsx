import React, { useState } from 'react';
import { Table, Button, Tag, Card, Avatar, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import CreateBlogModal from './components/CreateBlogModal';

const BlogPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([
    {
      key: '1', id: 101, title: 'Top 5 loại hoa tặng sinh nhật ý nghĩa nhất', category: 'Kiến thức', author: 'Admin',
      date: '30/01/2026', status: 'Published', thumbnail: 'https://images.unsplash.com/photo-1563241527-3004b7be0fee?auto=format&fit=crop&w=100&q=80'
    },
    {
      key: '2', id: 102, title: 'Thông báo lịch nghỉ Tết Nguyên Đán 2026', category: 'Tin tức', author: 'Manager',
      date: '28/01/2026', status: 'Draft', thumbnail: 'https://images.unsplash.com/photo-1516205651411-a427963b5379?auto=format&fit=crop&w=100&q=80'
    },
  ]);

  const handleCreate = (newItem) => {
    setData([newItem, ...data]);
    setIsModalOpen(false);
  };

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('Đã xóa bài viết');
  };

  const columns = [
    {
      title: 'BÀI VIẾT',
      width: 400,
      render: (_, record) => (
        <div className="flex gap-4">
           <img src={record.thumbnail} alt="thumb" className="w-16 h-16 rounded-lg object-cover shadow-sm" />
           <div>
              <h5 className="font-bold text-navy-700 m-0 line-clamp-2">{record.title}</h5>
              <div className="text-gray-400 text-xs mt-1"><FileTextOutlined /> {record.category} • {record.date}</div>
           </div>
        </div>
      )
    },
    {
      title: 'TÁC GIẢ',
      dataIndex: 'author',
      render: (val) => <Tag>{val}</Tag>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      render: (st) => <Tag color={st === 'Published' ? 'green' : 'orange'}>{st === 'Published' ? 'Đã đăng' : 'Bản nháp'}</Tag>
    },
    {
      title: 'THAO TÁC',
      render: (_, record) => (
        <div className="flex gap-2">
           <Button icon={<EditOutlined />} size="small" />
           <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.key)} />
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-brand-500 h-10 px-6 rounded-xl font-bold border-none shadow-brand-500/50">
          Viết bài mới
        </Button>
      </div>
      <Card className="rounded-[20px] shadow-sm border-none p-0">
         <Table columns={columns} dataSource={data} pagination={{ pageSize: 5 }} className="custom-table-metrix" />
      </Card>
      <CreateBlogModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default BlogPage;