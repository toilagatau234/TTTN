import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, message, Button } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import uploadService from '../../../../services/uploadService';

const CreateCategoryModal = ({ open, onCancel, onCreate, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // Loading khi submit form
  const [uploading, setUploading] = useState(false); // Loading khi up ảnh
  const [imageUrl, setImageUrl] = useState(null); // Link ảnh để hiển thị preview
  const [publicId, setPublicId] = useState(null); // ID ảnh để lưu vào DB

  // Reset form mỗi khi mở modal hoặc thay đổi dữ liệu sửa
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Chế độ Sửa (Edit)
        form.setFieldsValue(initialData);
        setImageUrl(initialData.image);
        setPublicId(initialData.publicId);
      } else {
        // Chế độ Thêm mới (Create) -> Reset trắng
        form.resetFields();
        setImageUrl(null);
        setPublicId(null);
      }
    }
  }, [open, initialData, form]);

  // Xử lý Upload ảnh ngay khi chọn file
  const handleUpload = async (info) => {
    const file = info.file;
    if (!file) return;

    // Chỉ cho phép ảnh < 5MB
    const isLt2M = file.size / 1024 / 1024 < 5;
    if (!isLt2M) {
      message.error('Ảnh phải nhỏ hơn 5MB!');
      return;
    }

    try {
      setUploading(true);
      // Gọi API Upload
      const res = await uploadService.uploadImage(file);

      if (res.success) {
        setImageUrl(res.imageUrl); // Hiển thị ảnh lên UI
        setPublicId(res.publicId); // Lưu ID để gửi về Backend
        message.success('Upload ảnh thành công!');
      }
    } catch (error) {
      message.error('Upload ảnh thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Gộp dữ liệu form + dữ liệu ảnh
      const formData = {
        ...values,
        image: imageUrl,
        publicId: publicId
      };

      await onCreate(formData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log('Validate Failed:', error);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">{initialData ? "Cập nhật Danh mục" : "Thêm Danh mục mới"}</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={initialData ? "Lưu thay đổi" : "Tạo mới"}
      cancelText="Hủy"
      centered
    >
      <Form form={form} layout="vertical" className="mt-4">

        {/* Khu vực Upload Ảnh */}
        <div className="flex flex-col items-center mb-6">
          <Upload
            showUploadList={false}
            beforeUpload={(file) => { handleUpload({ file }); return false; }} // Return false để chặn antd tự upload
          >
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-gray-50 transition-all overflow-hidden relative">
              {uploading ? (
                <LoadingOutlined className="text-2xl text-brand-500" />
              ) : imageUrl ? (
                <img src={imageUrl} alt="category" className="w-full h-full object-cover" />
              ) : (
                <>
                  <UploadOutlined className="text-2xl text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">Upload Ảnh</span>
                </>
              )}
            </div>
          </Upload>
          {/* Nút xóa ảnh nếu đã có */}
          {imageUrl && (
            <Button type="link" danger size="small" onClick={() => { setImageUrl(null); setPublicId(null); }}>Xóa ảnh</Button>
          )}
        </div>

        <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}>
          <Input placeholder="Ví dụ: Hoa Hồng, Quà tặng..." className="h-[40px] rounded-lg" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn..." className="rounded-lg" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateCategoryModal;