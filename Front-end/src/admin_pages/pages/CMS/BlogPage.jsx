import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Card, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import CreateBlogModal from './components/CreateBlogModal';
import blogService from '../../../services/blogService';

const BlogPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchBlogs(1);
  }, []);

  const fetchBlogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await blogService.getAll({ page, limit: pagination.pageSize });
      if (res.success) {
        setData(res.data.map(item => ({ ...item, key: item._id })));
        setPagination(prev => ({ ...prev, current: res.pagination.page, total: res.pagination.total }));
      }
    } catch (error) {
      message.error('Lỗi tải danh sách Blog');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values, thumbnailBase64) => {
    try {
      const res = await blogService.create({ ...values, thumbnailBase64 });
      if (res.success) {
        message.success('Tạo bài viết thành công!');
        fetchBlogs(1);
        setIsModalOpen(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await blogService.delete(id);
      if (res.success) {
         message.success('Đã xóa bài viết');
         fetchBlogs(pagination.current);
      }
    } catch (error) {
       message.error('Lỗi xóa bài viết');
    }
  };

  const handleTableChange = (pag) => {
    fetchBlogs(pag.current);
  };

  const columns = [
    {
      title: 'BÀI VIẾT',
      width: 400,
      render: (_, record) => (
        <div className="flex gap-4">
           <img src={record.thumbnail?.url || 'https://via.placeholder.com/150'} alt="thumb" className="w-16 h-16 rounded-lg object-cover shadow-sm" />
           <div>
              <h5 className="font-bold text-navy-700 m-0 line-clamp-2">{record.title}</h5>
              <div className="text-gray-400 text-xs mt-1"><FileTextOutlined className="mr-1" /> {record.category} • {new Date(record.createdAt).toLocaleDateString('vi-VN')}</div>
           </div>
        </div>
      )
    },
    {
      title: 'TÁC GIẢ',
      render: (_, record) => <Tag>{record.authorName || record.author?.name || 'Hệ thống'}</Tag>
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
           <Button icon={<EditOutlined />} />
           <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record._id)} />
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => fetchBlogs(1)} loading={loading}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-brand-500 h-10 px-6 rounded-xl font-bold border-none shadow-brand-500/50">
            Viết bài mới
          </Button>
        </div>
      </div>
      <Card className="rounded-[20px] shadow-sm border-none p-0">
         <Table columns={columns} dataSource={data} loading={loading} pagination={pagination} onChange={handleTableChange} className="custom-table-metrix" locale={{ emptyText: 'Chưa có bài viết nào' }} />
      </Card>
      <CreateBlogModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default BlogPage;