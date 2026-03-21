import React, { useState } from 'react';
import userService from '../../../../services/userService';
import { Modal, Form, Input, Select, Upload, message, Row, Col, Button } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, IdcardOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const CreateStaffModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      const response = await userService.add({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        department: values.department,
        phone: values.phone
      });

      if (response.success) {
        message.success('Thêm nhân viên mới thành công!');
        onCreate(response.data);
        form.resetFields();
      } else {
        message.error(response.message || 'Lỗi khi tạo nhân viên');
      }
    } catch (error) {
      if (error.response && error.response.data) {
         message.error(error.response.data.message || 'Lỗi khi tạo nhân viên');
      } else {
         console.log('Validate Failed:', error);
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Thêm Nhân Viên Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
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
            <Form.Item name="department" label="Bộ phận" rules={[{ required: true, message: 'Vui lòng chọn bộ phận' }]}>
               <Select className="h-[40px] custom-select-metrix rounded-xl" placeholder="Chọn bộ phận">
                 <Option value="Kinh doanh">Kinh doanh</Option>
                 <Option value="Kho vận">Kho vận</Option>
                 <Option value="Marketing">Marketing</Option>
                 <Option value="CSKH">CSKH</Option>
                 <Option value="Kế toán">Kế toán</Option>
                 <Option value="Hành chính">Hành chính Nhân sự</Option>
                 <Option value="Ban Giám Đốc">Ban Giám Đốc</Option>
               </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateStaffModal;