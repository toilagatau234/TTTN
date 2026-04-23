import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Upload, message } from 'antd';
import { LoadingOutlined, PictureOutlined, LinkOutlined } from '@ant-design/icons';

const CreateBannerModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const handleUploadChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageUrl(reader.result);
      setLoading(false);
    });
    reader.readAsDataURL(file);
  };

  const handleOk = async () => {
    try {
      if (!imageUrl) {
         message.error('Vui lòng chọn hình ảnh Banner');
         return;
      }
      const values = await form.validateFields();
      onCreate(
        { ...values, status: values.status ? 'Active' : 'Inactive' },
        imageUrl
      );
      form.resetFields();
      setImageUrl(null);
      message.success('Thêm banner thành công!');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Thêm Banner Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Lưu Banner"
      cancelText="Hủy"
      centered
      className="custom-modal-metrix"
    >
      <Form form={form} layout="vertical" className="mt-4" initialValues={{ status: true, order: 1 }}>
        <Form.Item label="Hình ảnh Banner" required>
          <Upload
            name="avatar"
            listType="picture-card"
            className="avatar-uploader w-full banner-upload"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleUploadChange}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="banner" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 w-full h-[120px]">
                {loading ? <LoadingOutlined /> : <PictureOutlined className="text-2xl" />}
                <div className="mt-2 text-[10px] opacity-70 px-2 italic text-center">Gợi ý: 1920x600 (Hệ thống sẽ tự động điều chỉnh ảnh để không bị méo)</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item name="title" label="Tiêu đề (Alt Text)" rules={[{ required: true }]}>
          <Input placeholder="VD: Khuyến mãi Tết 2026" className="rounded-xl h-[40px]" />
        </Form.Item>

        <Form.Item name="link" label="Đường dẫn (Link khi bấm vào)">
          <Input prefix={<LinkOutlined className="text-gray-400" />} placeholder="/products?category=tet" className="rounded-xl h-[40px]" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
           <Form.Item name="order" label="Thứ tự hiển thị">
             <InputNumber min={1} className="w-full rounded-xl h-[40px] flex items-center" />
           </Form.Item>
           <Form.Item name="status" label="Trạng thái" valuePropName="checked">
             <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
           </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateBannerModal;
