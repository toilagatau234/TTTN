import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Upload, message } from 'antd';
import { UploadOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
// Đảm bảo bạn import đúng đường dẫn uploadService
import uploadService from '../../../../services/uploadService';

// Hàm chuyển file sang base64 để xem trước (Preview)
const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

const CreateCategoryModal = ({ open, onCancel, onSuccess, initialData }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false); // Loading của nút Lưu
    const [uploading, setUploading] = useState(false); // Loading khi đang upload ảnh

    const [fileList, setFileList] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    // --- 1. Load dữ liệu khi mở Modal (Chế độ Edit) ---
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Fill thông tin text
                form.setFieldsValue({
                    name: initialData.name,
                    description: initialData.description
                });
                // Fill hình ảnh cũ (nếu có)
                if (initialData.image) {
                    setFileList([{
                        uid: '-1',
                        name: 'hinh-anh-hien-tai.png',
                        status: 'done',
                        url: initialData.image, // URL từ Cloudinary
                    }]);
                } else {
                    setFileList([]);
                }
            } else {
                // Reset form khi tạo mới
                form.resetFields();
                setFileList([]);
            }
        }
    }, [open, initialData, form]);

    // --- 2. Xử lý logic Upload ---
    
    // Kiểm tra file trước khi upload
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Bạn chỉ có thể upload file ảnh!');
            return Upload.LIST_IGNORE;
        }
        // Đồng bộ với Backend là 10MB (như đã sửa ở bước trước)
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('Kích thước ảnh phải nhỏ hơn 10MB!');
            return Upload.LIST_IGNORE;
        }
        return false; // Return false để chặn antd tự upload, ta sẽ xử lý thủ công
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
        setPreviewTitle(file.name || 'Xem trước hình ảnh');
    };

    // --- 3. Xử lý Submit Form ---
    const onFinish = async (values) => {
        setLoading(true);
        try {
            let imageUrl = initialData?.image || ''; // Mặc định là ảnh cũ
            let publicId = initialData?.publicId || '';

            // Kiểm tra xem người dùng có chọn ảnh MỚI không?
            const newFile = fileList.find(f => f.originFileObj);
            
            if (newFile) {
                // BẮT ĐẦU UPLOAD ẢNH MỚI
                setUploading(true);
                try {
                    const uploadRes = await uploadService.uploadImage(newFile.originFileObj);
                    if (uploadRes.success) {
                        imageUrl = uploadRes.imageUrl;
                        publicId = uploadRes.publicId;
                        // message.success('Upload ảnh thành công!');
                    }
                } catch (uploadError) {
                    message.error('Lỗi khi upload ảnh: ' + (uploadError.response?.data?.message || uploadError.message));
                    setLoading(false);
                    setUploading(false);
                    return; // Dừng lại nếu upload lỗi
                }
                setUploading(false);
            } else if (fileList.length === 0) {
                // Nếu người dùng xóa hết ảnh trong list -> Xóa ảnh trong DB
                imageUrl = '';
                publicId = '';
            }

            // Chuẩn bị dữ liệu JSON để gửi về Backend
            const categoryData = {
                name: values.name,
                description: values.description,
                image: imageUrl,    // Gửi URL string
                publicId: publicId  // Gửi ID ảnh để sau này xóa
            };

            // Gọi hàm onSuccess (được truyền từ props cha để gọi API create/update)
            await onSuccess(categoryData);

            // Cleanup
            form.resetFields();
            setFileList([]);
            onCancel();

        } catch (error) {
            console.error("Submit error", error);
            message.error("Có lỗi xảy ra khi lưu danh mục");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                title={
                    <div className="modal-header-custom flex items-center gap-2">
                        <PictureOutlined className="text-xl text-brand-500" />
                        <span className="text-xl font-bold text-navy-700">
                            {initialData ? "Cập nhật danh mục" : "Thêm mới danh mục"}
                        </span>
                    </div>
                }
                open={open}
                onCancel={onCancel}
                footer={null}
                className="category-modal"
                width={500}
                centered
                destroyOnClose // Dùng destroyOnClose cho antd v4/v5 đều ổn, v5 ưu tiên destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
                    
                    {/* Phần Upload Ảnh */}
                    <Form.Item label="Hình ảnh minh họa" className="mb-6">
                        <div className="flex justify-center">
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
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        {uploading ? <LoadingOutlined /> : <UploadOutlined className="text-xl mb-2" />}
                                        <div className="text-xs">{uploading ? "Đang lên..." : "Tải ảnh"}</div>
                                    </div>
                                )}
                            </Upload>
                        </div>
                    </Form.Item>

                    <Form.Item
                        label="Tên danh mục"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                    >
                        <Input placeholder="Ví dụ: Hoa Hồng, Quà tặng..." className="h-10 rounded-lg" />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea 
                            rows={3} 
                            placeholder="Mô tả ngắn gọn về danh mục..." 
                            className="rounded-lg" 
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button onClick={onCancel} className="h-10 rounded-lg">
                            Hủy
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading || uploading} // Disable nút khi đang load hoặc đang upload
                            className="bg-brand-500 h-10 rounded-lg font-medium"
                        >
                            {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Modal xem trước ảnh */}
            <Modal
                open={previewOpen}
                title={previewTitle}
                footer={null}
                onCancel={() => setPreviewOpen(false)}
                centered
            >
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </>
    );
};

export default CreateCategoryModal;