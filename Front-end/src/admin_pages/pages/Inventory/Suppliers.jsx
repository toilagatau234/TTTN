import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, message, Card } from 'antd';
import { PlusOutlined, SearchOutlined, PhoneOutlined, EnvironmentOutlined, ShopOutlined } from '@ant-design/icons';
import inventoryService from '../../../services/inventoryService';

const SuppliersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getSuppliers({ keyword: searchTerm });
      if (res.success) {
        // Map backend _id to antd key
        const mappedData = res.data.map(item => ({
          ...item,
          key: item._id,
          products: item.products || 0 // Thống kê tuỳ chỉnh thêm sau
        }));
        setSuppliers(mappedData);
      }
    } catch (error) {
      message.error('Lỗi tải danh sách nhà cung cấp!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce basic for search term
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAdd = async (values) => {
    try {
      await inventoryService.createSupplier(values);
      message.success('Thêm nhà cung cấp thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchSuppliers(); // Refresh table
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm NCC');
    }
  };

  const columns = [
    {
      title: 'NHÀ CUNG CẤP',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-bold text-navy-700"><ShopOutlined className="mr-2"/>{text}</span>
    },
    {
      title: 'LIÊN HỆ',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => <span className="text-gray-500"><PhoneOutlined className="mr-1"/>{text}</span>
    },
    {
      title: 'ĐỊA CHỈ',
      dataIndex: 'address',
      key: 'address',
      render: (text) => <span className="text-gray-500"><EnvironmentOutlined className="mr-1"/>{text}</span>
    },
    {
      title: 'SỐ LẦN NHẬP',
      dataIndex: 'importCount',
      key: 'importCount',
      render: (val) => <span className="font-bold text-brand-500">{val || 0} lần</span>
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-navy-700">Nhà Cung Cấp</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-brand-500 rounded-xl h-[40px] font-bold border-none">
          Thêm NCC
        </Button>
      </div>

      <Card className="rounded-[20px] shadow-sm border-none">
         <div className="mb-4">
            <Input 
              prefix={<SearchOutlined />} 
              placeholder="Tìm nhà cung cấp..." 
              className="w-[300px] rounded-xl h-[40px] bg-[#F4F7FE] border-none" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <Table loading={loading} columns={columns} dataSource={suppliers} pagination={false} className="custom-table-metrix" />
      </Card>

      <Modal title="Thêm Nhà Cung Cấp" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} centered>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
           <Form.Item name="name" label="Tên NCC" rules={[{ required: true }]}><Input className="rounded-xl" /></Form.Item>
           <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}><Input className="rounded-xl" /></Form.Item>
           <Form.Item name="address" label="Địa chỉ"><Input className="rounded-xl" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;