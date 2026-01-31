import React, { useState } from 'react';
import { Table, Button, Input, Modal, Form, message, Card } from 'antd';
import { PlusOutlined, SearchOutlined, PhoneOutlined, EnvironmentOutlined, ShopOutlined } from '@ant-design/icons';

const SuppliersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Dữ liệu giả 
  const [suppliers, setSuppliers] = useState([
    { key: '1', name: 'Vườn Hoa Đà Lạt Hasfarm', phone: '0263 382 1234', address: '450 Nguyên Tử Lực, Đà Lạt', products: 15 },
    { key: '2', name: 'Hoa Nhập Khẩu Hà Lan', phone: '0909 888 777', address: 'Quận 1, TP.HCM', products: 8 },
  ]);

  const handleAdd = (values) => {
    const newSupplier = {
      key: Date.now(),
      ...values,
      products: 0
    };
    setSuppliers([newSupplier, ...suppliers]);
    setIsModalOpen(false);
    form.resetFields();
    message.success('Thêm nhà cung cấp thành công!');
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
      dataIndex: 'products',
      key: 'products',
      render: (val) => <span className="font-bold text-brand-500">{val} lần</span>
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
            <Input prefix={<SearchOutlined />} placeholder="Tìm nhà cung cấp..." className="w-[300px] rounded-xl h-[40px] bg-[#F4F7FE] border-none" />
         </div>
         <Table columns={columns} dataSource={suppliers} pagination={false} className="custom-table-metrix" />
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