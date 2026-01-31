import React, { useState } from 'react';
import { Modal, Form, Input, Select, Upload, message, Row, Col, Button } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, IdcardOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const CreateStaffModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Giả lập dữ liệu tạo mới
      const newStaff = {
        key: Date.now(),
        id: `STF-${Math.floor(Math.random() * 1000)}`,
        avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 20), // Avatar ngẫu nhiên
        joinDate: new Date().toLocaleDateString('vi-VN'),
        lastActive: 'Vừa xong',
        status: 'Active',
        ...values
      };

      onCreate(newStaff);
      form.resetFields();
      message.success('Thêm nhân viên mới thành công!');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Thêm Nhân Viên Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={700}
      okText="Lưu Hồ Sơ"
      cancelText="Hủy"
      centered
      className="custom-modal-metrix"
    >
      <Form form={form} layout="vertical" className="mt-5" initialValues={{ role: 'Sale', status: 'Active' }}>
        
        {/* Upload Avatar Giả lập */}
        <div className="flex justify-center mb-6">
           <Upload showUploadList={false} beforeUpload={() => false}>
              <div className="flex flex-col items-center cursor-pointer text-brand-500 hover:text-brand-600">
                 <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-2 border-2 border-dashed border-gray-300">
                    <UploadOutlined className="text-2xl" />
                 </div>
                 <span className="text-xs font-bold">Upload Ảnh</span>
              </div>
           </Upload>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nguyễn Văn A" className="rounded-xl h-[40px]" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
              <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="0909..." className="rounded-xl h-[40px]" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="email" label="Email đăng nhập" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
              <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="staff@flower.shop" className="rounded-xl h-[40px]" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="password" label="Mật khẩu khởi tạo" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} className="rounded-xl h-[40px]" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="role" label="Chức vụ / Vai trò">
              <Select className="h-[40px] custom-select-metrix rounded-xl">
                <Option value="Admin">Admin (Quản trị viên)</Option>
                <Option value="Manager">Manager (Quản lý)</Option>
                <Option value="Sale">Sale (Nhân viên kinh doanh)</Option>
                <Option value="Warehouse">Warehouse (Thủ kho)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department" label="Bộ phận">
               <Input prefix={<IdcardOutlined className="text-gray-400" />} placeholder="Phòng kinh doanh..." className="rounded-xl h-[40px]" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateStaffModal;