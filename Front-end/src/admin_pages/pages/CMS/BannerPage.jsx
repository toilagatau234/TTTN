import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import CreateBannerModal from './components/CreateBannerModal';
import bannerService from '../../../services/bannerService';

const BannerPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await bannerService.getAll();
      if (res.success) {
        setData(res.data.map(item => ({ ...item, key: item._id })));
      }
    } catch (error) {
      message.error('Lỗi tải danh sách Banner');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values, imageBase64) => {
    try {
      const res = await bannerService.create({ ...values, imageBase64 });
      if (res.success) {
        message.success('Thêm banner thành công!');
        fetchBanners();
        setIsModalOpen(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleArchive = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Archived' ? 'Active' : 'Archived';
      const res = await bannerService.update(id, { status: newStatus });
      if (res.success) {
        message.success(`Đã chuyển trạng thái banner thành ${newStatus}`);
        fetchBanners();
      }
    } catch (error) {
       message.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await bannerService.delete(id);
      if (res.success) {
         message.success('Đã xóa vĩnh viễn banner');
         fetchBanners();
      }
    } catch (error) {
      message.error('Lỗi xóa banner');
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      message.error('Không thể tải ảnh');
    }
  };

  const columns = [
    {
      title: 'HÌNH ẢNH',
      dataIndex: 'image',
      width: 250,
      render: (img) => <img src={img?.url || 'https://via.placeholder.com/800x300'} alt="banner" className="w-full h-28 object-cover rounded-xl shadow-sm" />
    },
    {
      title: 'THÔNG TIN',
      render: (_, record) => (
        <div>
           <h5 className="font-bold text-navy-700 m-0 text-lg">{record.title}</h5>
           <div className="text-gray-400 text-sm mt-1">Link: <span className="text-blue-500">{record.link}</span></div>
        </div>
      )
    },
    {
      title: 'THỨ TỰ',
      dataIndex: 'order',
      render: (val) => <div className="font-bold text-center w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">{val}</div>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      render: (status) => {
         let color = 'green';
         let text = 'Hiển thị';
         if (status === 'Inactive') { color = 'red'; text = 'Đang ẩn'; }
         if (status === 'Archived') { color = 'default'; text = 'Lưu trữ'; }
         return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'HÀNH ĐỘNG',
      render: (_, record) => (
        <div className="flex gap-2">
           <Tooltip title="Tải xuống (Tái sử dụng mùa tới)">
             <Button icon={<DownloadOutlined />} className="text-blue-500 border-blue-200" onClick={() => handleDownload(record.image.url, record.title)} />
           </Tooltip>
           <Tooltip title={record.status === 'Archived' ? 'Phục hồi lại' : 'Lưu trữ (Ẩn)'}>
             <Button icon={<InboxOutlined />} className="text-orange-500 border-orange-200" onClick={() => handleArchive(record._id, record.status)} />
           </Tooltip>
           <Tooltip title="Xóa vĩnh viễn">
             <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record._id)} />
           </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
           <Button icon={<ReloadOutlined />} onClick={fetchBanners} loading={loading}>Làm mới</Button>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-brand-500 h-10 px-6 rounded-xl font-bold border-none shadow-brand-500/50">
          Thêm Banner
        </Button>
      </div>
      <Card className="rounded-[20px] shadow-sm border-none p-0">
         <Table columns={columns} dataSource={data} loading={loading} pagination={false} className="custom-table-metrix" locale={{ emptyText: 'Chưa có Banner nào' }} />
      </Card>
      <CreateBannerModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default BannerPage;