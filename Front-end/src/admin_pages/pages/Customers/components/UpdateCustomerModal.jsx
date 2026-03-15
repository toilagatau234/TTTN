import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message, Row, Col } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  UploadOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import userService from '../../../../services/userService';

const { Option } = Select;

const UpdateCustomerModal = ({ open, onCancel, onUpdate, customer }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      form.setFieldsValue({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role || 'User',
        status: customer.status || 'Active',
      });
      setImageUrl(customer.avatar || null);
    }
  }, [open, customer, form]);

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      const res = await userService.uploadImage(formData);
      if (res && (res.imageUrl || res.url)) {
        setImageUrl(res.imageUrl || res.url);
        onSuccess("ok");
        message.success("Tải ảnh lên thành công");
      } else {
        message.error("Không thể lấy URL ảnh");
        onError("error");
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi upload ảnh");
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (imageUrl) {
        values.avatar = imageUrl;
      } else {
        values.avatar = null; 
      }
      setLoading(true);

      await onUpdate(customer._id, values);
      setLoading(false);
    } catch (error) {
      console.log('Validate Failed:', error);
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Cập Nhật Thông Tin Khách Hàng</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Lưu Thay Đổi"
      cancelText="Hủy Bỏ"
      width={700}
      centered
      className="custom-modal-metrix"
    >
      <Form 
        form={form} 
        layout="vertical" 
        className="mt-6"
      >
        
        {/* --- ẢNH ĐẠI DIỆN --- */}
        <div className="flex justify-center mb-8">
           <Upload 
             name="avatar" 
             showUploadList={false} 
             listType="picture-circle" 
             className="avatar-uploader"
             customRequest={handleUpload}
             beforeUpload={(file) => {
               const isLt2M = file.size / 1024 / 1024 < 2;
               if (!isLt2M) {
                 message.error('Ảnh phải nhỏ hơn 2MB!');
               }
               return isLt2M;
             }}
           >
              {imageUrl ? (
                <img src={imageUrl} alt="avatar" className="w-[100px] h-[100px] rounded-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-500 transition-colors">
                   {uploading ? <LoadingOutlined /> : <UploadOutlined className="text-xl" />}
                   <div className="mt-2 text-xs">Upload</div>
                </div>
              )}
           </Upload>
        </div>

        {/* --- THÔNG TIN CÁ NHÂN --- */}
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
          <Col span={24}>
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
        </Row>

        {/* --- TRẠNG THÁI TÀI KHOẢN --- */}
        <Row gutter={16}>
          <Col span={24}>
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

export default UpdateCustomerModal;
