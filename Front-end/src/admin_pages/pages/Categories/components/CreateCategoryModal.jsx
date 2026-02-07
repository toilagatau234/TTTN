import React, { useState } from 'react';
import { Modal, Form, Input, Button, Upload, message } from 'antd';
import { UploadOutlined, PictureOutlined } from '@ant-design/icons';
import categoryService from '../../../../services/categoryService';
import './CreateCategoryModal.css';

const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

const CreateCategoryModal = ({ open, onCancel, onSuccess, initialData }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // State lưu file gốc (binary) để gửi lên server
    const [fileList, setFileList] = useState([]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    // Effect để load data khi sửa
    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue({
                    name: initialData.name,
                    description: initialData.description
                });
                if (initialData.image) {
                    setFileList([{
                        uid: '-1',
                        name: 'image.png',
                        status: 'done',
                        url: initialData.image,
                    }]);
                } else {
                    setFileList([]);
                }
            } else {
                form.resetFields();
                setFileList([]);
            }
        }
    }, [open, initialData, form]);

    // Hàm xử lý khi chọn ảnh
    const handleUploadChange = ({ fileList: newFileList }) => {
        // Chỉ giữ lại file mới nhất (nếu muốn upload 1 ảnh)
        setFileList(newFileList.slice(-1));
    };

    // Chặn hành động upload tự động mặc định của Ant Design
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Bạn chỉ có thể upload file ảnh!');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Kích thước ảnh phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }
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

            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append('image', fileList[0].originFileObj);
            }

            // Gọi hàm submit từ prop (Create hoặc Update)
            await onSuccess(formData);

            form.resetFields();
            setFileList([]); // Reset file
            onCancel();  // Đóng modal

        } catch (error) {
            // Lỗi sẽ được catch ở parent, nhưng nếu có lỗi ở đây thì log ra
            console.error("Submit error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                title={
                    <div className="modal-header-custom">
                        <PictureOutlined className="modal-icon" />
                        <span>{initialData ? "Cập nhật danh mục" : "Thêm mới danh mục"}</span>
                    </div>
                }
                open={open}
                onCancel={onCancel}
                footer={null}
                className="category-modal"
                width={600}
                centered
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={onFinish} className="category-form">
                    <Form.Item
                        label={<span className="form-label">Tên danh mục</span>}
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                    >
                        <Input
                            placeholder="Nhập tên danh mục..."
                            size="large"
                            className="form-input"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="form-label">Mô tả</span>}
                        name="description"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Nhập mô tả..."
                            className="form-input"
                        />
                    </Form.Item>

                    <Form.Item label={<span className="form-label">Hình ảnh</span>}>
                        <div className="upload-container">
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onPreview={handlePreview}
                                onChange={handleUploadChange}
                                beforeUpload={beforeUpload}
                                maxCount={1}
                                accept="image/*"
                                className="custom-upload"
                            >
                                {fileList.length < 1 && (
                                    <div className="upload-placeholder">
                                        <UploadOutlined className="upload-icon" />
                                        <div className="upload-text">Chọn ảnh</div>
                                        <div className="upload-hint">PNG, JPG, WEBP (tối đa 5MB)</div>
                                    </div>
                                )}
                            </Upload>
                        </div>
                    </Form.Item>

                    <div className="form-footer">
                        <Button
                            onClick={onCancel}
                            size="large"
                            className="btn-cancel"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            className="btn-submit"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu lại'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                open={previewOpen}
                title={previewTitle}
                footer={null}
                onCancel={handleCancelPreview}
                className="preview-modal"
                centered
            >
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </>
    );
};

export default CreateCategoryModal;