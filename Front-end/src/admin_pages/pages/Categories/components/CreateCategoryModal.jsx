import React, { useState } from 'react';
import { Modal, Form, Input, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import categoryService from '../../../../services/categoryService';

const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

const CreateCategoryModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    
    // State lưu file gốc (binary) để gửi lên server
    const [fileList, setFileList] = useState([]); 
    
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    // Hàm xử lý khi chọn ảnh
    const handleUploadChange = ({ fileList: newFileList }) => {
        // Chỉ giữ lại file mới nhất (nếu muốn upload 1 ảnh)
        setFileList(newFileList.slice(-1));
    };

    // Chặn hành động upload tự động mặc định của Ant Design
    const beforeUpload = (file) => {
        return false;
    };

    const handleCancelPreview = () => setPreviewOpen(false);

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('description', values.description || '');

            if (fileList.length > 0) {
                formData.append('image', fileList[0].originFileObj);
            }

            await categoryService.createCategory(formData);

            message.success('Thêm danh mục thành công!');
            form.resetFields();
            setFileList([]); // Reset file
            onSuccess(); // Refresh lại bảng danh mục
            onCancel();  // Đóng modal

        } catch (error) {
            message.error('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Modal
            title="Thêm mới danh mục"
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="Tên danh mục"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                >
                    <Input placeholder="Nhập tên danh mục..." />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={3} placeholder="Nhập mô tả..." />
                </Form.Item>

                <Form.Item label="Hình ảnh">
                    {/* Upload Component của AntD */}
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onPreview={handlePreview}
                        onChange={handleUploadChange}
                        beforeUpload={beforeUpload}
                        maxCount={1}
                        accept="image/*"
                    >
                        {fileList.length < 1 && (
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                            </div>
                        )}
                    </Upload>
                </Form.Item>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Lưu lại
                    </Button>
                </div>
            </Form>
        </Modal>
        <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancelPreview}>
            <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
        </>
    );
};

export default CreateCategoryModal;