import React, { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Upload, message, Button } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const CreateBlogModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState(null);

  const handleUpload = (info) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
        const reader = new FileReader();
        reader.addEventListener('load', () => setImageUrl(reader.result));
        reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const newBlog = {
        key: Date.now(),
        id: Math.floor(Math.random() * 1000),
        thumbnail: imageUrl || 'https://via.placeholder.com/150',
        author: 'Admin',
        date: new Date().toLocaleDateString('vi-VN'),
        ...values,
        status: values.status ? 'Published' : 'Draft'
      };
      onCreate(newBlog);
      form.resetFields();
      setImageUrl(null);
      message.success('Đăng bài viết thành công!');
    } catch (error) { console.log(error); }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Viết Bài Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      okText="Đăng Bài"
      centered
      className="custom-modal-metrix"
    >
      <Form form={form} layout="vertical" className="mt-4" initialValues={{ status: true, category: 'Kiến thức' }}>
        <div className="flex gap-6">
            {/* Cột trái: Ảnh */}
            <div className="w-[200px]">
                <Form.Item label="Ảnh đại diện">
                    <Upload
                        listType="picture-card"
                        showUploadList={false}
                        beforeUpload={() => false}
                        onChange={handleUpload}
                    >
                        {imageUrl ? <img src={imageUrl} alt="thumb" className="w-full h-full object-cover" /> : <div><PlusOutlined /><div className="mt-2">Upload</div></div>}
                    </Upload>
                </Form.Item>
            </div>
            
            {/* Cột phải: Thông tin */}
            <div className="flex-1">
                <Form.Item name="title" label="Tiêu đề bài viết" rules={[{ required: true }]}>
                    <Input className="rounded-xl h-[40px] font-bold" placeholder="VD: Ý nghĩa hoa hồng đỏ..." />
                </Form.Item>
                <div className="flex gap-4">
                    <Form.Item name="category" label="Chuyên mục" className="flex-1">
                        <Select className="rounded-xl h-[40px] custom-select-metrix">
                            <Option value="Kiến thức">Kiến thức hoa</Option>
                            <Option value="Tin tức">Tin tức Shop</Option>
                            <Option value="Khuyến mãi">Khuyến mãi</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái" valuePropName="checked">
                        <Switch checkedChildren="Công khai" unCheckedChildren="Nháp" />
                    </Form.Item>
                </div>
            </div>
        </div>

        <Form.Item name="summary" label="Mô tả ngắn">
            <TextArea rows={2} className="rounded-xl" />
        </Form.Item>

        <Form.Item name="content" label="Nội dung chính">
            <TextArea rows={8} className="rounded-xl" placeholder="Nội dung bài viết (Hỗ trợ Markdown hoặc HTML cơ bản)..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBlogModal;
