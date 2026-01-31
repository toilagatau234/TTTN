import React, { useState } from 'react';
import { Modal, Form, Input, Select, Upload, message, Row, Col } from 'antd';
import { LoadingOutlined, PlusOutlined, FileImageOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const CreateCategoryModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  // Xử lý upload ảnh icon
  const handleUploadChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => setImageUrl(reader.result));
    reader.readAsDataURL(info.file.originFileObj);
    setLoading(false);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const newCategory = {
        key: Date.now(),
        id: Math.floor(Math.random() * 100),
        ...values,
        icon: imageUrl || 'https://via.placeholder.com/150', // Icon mặc định
        count: 0,
        createdAt: new Date().toLocaleDateString('vi-VN')
      };

      onCreate(newCategory);
      form.resetFields();
      setImageUrl(null);
      message.success('Thêm danh mục thành công!');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Tạo Danh Mục Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={600}
      okText="Lưu Danh Mục"
      cancelText="Hủy"
      centered
      className="custom-modal-metrix"
    >
      <Form 
        form={form} 
        layout="vertical" 
        className="mt-5"
        initialValues={{ status: 'Active' }}
      >
        <div className="flex gap-6">
          {/* Cột trái: Upload Icon */}
          <div className="flex-shrink-0">
             <Form.Item label="Icon / Ảnh" name="icon">
               <Upload
                  name="avatar"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleUploadChange}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="icon" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      {loading ? <LoadingOutlined /> : <PlusOutlined />}
                      <div className="mt-2 text-xs">Upload</div>
                    </div>
                  )}
                </Upload>
             </Form.Item>
          </div>

          {/* Cột phải: Thông tin */}
          <div className="flex-1">
             <Form.Item 
                name="name" 
                label="Tên danh mục" 
                rules={[{ required: true, message: 'Nhập tên danh mục!' }]}
             >
               <Input placeholder="Ví dụ: Hoa Hồng" className="rounded-xl h-[40px]" />
             </Form.Item>

             <Form.Item name="status" label="Trạng thái">
               <Select className="h-[40px] custom-select-metrix rounded-xl">
                 <Option value="Active">Hiển thị (Active)</Option>
                 <Option value="Hidden">Ẩn (Hidden)</Option>
               </Select>
             </Form.Item>
          </div>
        </div>

        <Form.Item name="description" label="Mô tả danh mục">
          <TextArea rows={3} placeholder="Mô tả ngắn về loại hoa này..." className="rounded-xl" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateCategoryModal;