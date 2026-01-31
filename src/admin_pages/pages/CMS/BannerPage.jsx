import React, { useState } from 'react';
import { Table, Button, Tag, message, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import CreateBannerModal from './components/CreateBannerModal';

const BannerPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([
    {
      key: '1', id: 1, title: 'Banner Chào Mừng', link: '/home', order: 1, status: 'Active',
      image: 'https://img.freepik.com/free-psd/horizontal-banner-template-flower-shop_23-2148906325.jpg'
    },
    {
      key: '2', id: 2, title: 'Khuyến mãi Valentine', link: '/category/valentine', order: 2, status: 'Active',
      image: 'https://img.freepik.com/free-vector/flat-valentines-day-sale-horizontal-banner-template_23-2149247346.jpg'
    },
  ]);

  const handleCreate = (newItem) => {
    setData([...data, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('Đã xóa banner');
  };

  const columns = [
    {
      title: 'HÌNH ẢNH',
      dataIndex: 'image',
      width: 250,
      render: (src) => <img src={src} alt="banner" className="w-full h-28 object-cover rounded-xl shadow-sm" />
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
      render: (status) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status === 'Active' ? 'Hiển thị' : 'Đang ẩn'}</Tag>
    },
    {
      title: 'HÀNH ĐỘNG',
      render: (_, record) => (
        <div className="flex gap-2">
           <Button icon={<EditOutlined />} />
           <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.key)} />
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
          Thêm Banner
        </Button>
      </div>
      <Card className="rounded-[20px] shadow-sm border-none p-0">
         <Table columns={columns} dataSource={data} pagination={false} className="custom-table-metrix" />
      </Card>
      <CreateBannerModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default BannerPage;