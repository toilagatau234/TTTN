import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message, Row, Col } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LockOutlined, 
  UploadOutlined,
  LoadingOutlined
} from '@ant-design/icons';

const { Option } = Select;

const CreateCustomerModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Xử lý khi nhấn nút "Tạo mới"
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // --- LOGIC XỬ LÝ DỮ LIỆU ---
      // 1. Giả lập upload ảnh (Nếu có backend thì upload lên Cloudinary ở đây)
      const newCustomerData = {
        ...values,
        id: Math.floor(Math.random() * 10000), // ID giả lập
        joinDate: new Date().toLocaleDateString('vi-VN'),
        status: values.status || 'Active',
        avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), // Avatar ngẫu nhiên
        spent: '0 ₫' // Khách mới chưa chi tiêu
      };

      // 2. Gọi hàm callback để cập nhật lại bảng dữ liệu bên ngoài
      // Sau này thay bằng: await userService.add(newCustomerData);
      setTimeout(() => {
        onCreate(newCustomerData);
        message.success('Thêm khách hàng thành công!');
        form.resetFields(); // Xóa trắng form
        setLoading(false);
      }, 1000); // Giả lập độ trễ mạng 1s

    } catch (error) {
      console.log('Validate Failed:', error);
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Thêm Khách Hàng Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Lưu Khách Hàng"
      cancelText="Hủy Bỏ"
      width={700}
      centered
      className="custom-modal-metrix"
    >
      <Form 
        form={form} 
        layout="vertical" 
        className="mt-6"
        initialValues={{ role: 'User', status: 'Active' }}
      >
        
        {/* --- 1. ẢNH ĐẠI DIỆN --- */}
        <div className="flex justify-center mb-8">
           <Upload name="avatar" showUploadList={false} listType="picture-circle" className="avatar-uploader">
              <div className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-500 transition-colors">
                 {loading ? <LoadingOutlined /> : <UploadOutlined className="text-xl" />}
                 <div className="mt-2 text-xs">Upload</div>
              </div>
           </Upload>
        </div>

        {/* --- 2. THÔNG TIN CÁ NHÂN --- */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="name" 
              label="Họ và Tên" 
              rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nhập tên đầy đủ" className="rounded-xl h-[44px]" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="phone" 
              label="Số điện thoại" 
              rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}
            >
              <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="0909..." className="rounded-xl h-[44px]" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="email" 
              label="Email" 
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="example@gmail.com" className="rounded-xl h-[44px]" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="password" 
              label="Mật khẩu khởi tạo" 
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Tối thiểu 6 ký tự" className="rounded-xl h-[44px]" />
            </Form.Item>
          </Col>
        </Row>

        {/* --- 3. PHÂN QUYỀN & TRẠNG THÁI --- */}
        <Row gutter={16}>
          <Col span={12}>
             <Form.Item name="role" label="Vai trò hệ thống">
               <Select className="h-[44px] custom-select-metrix rounded-xl">
                 <Option value="User">Khách hàng (User)</Option>
                 <Option value="Admin">Quản trị viên (Admin)</Option>
                 <Option value="Staff">Nhân viên (Staff)</Option>
               </Select>
             </Form.Item>
          </Col>
          <Col span={12}>
             <Form.Item name="status" label="Trạng thái tài khoản">
               <Select className="h-[44px] custom-select-metrix rounded-xl">
                 <Option value="Active">Hoạt động (Active)</Option>
                 <Option value="Blocked">Khóa tạm thời (Blocked)</Option>
               </Select>
             </Form.Item>
          </Col>
        </Row>

      </Form>
    </Modal>
  );
};

export default CreateCustomerModal;