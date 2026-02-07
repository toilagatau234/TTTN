import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Upload, message, Select, InputNumber, Switch, Divider } from 'antd';
import { UploadOutlined, PictureOutlined, LoadingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import uploadService from '../../../../services/uploadService';
import categoryService from '../../../../services/categoryService';

const { Option } = Select;

// Helper to get base64 for preview
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CreateProductModal = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // State for multiple images
  // Each item: { uid, name, status, url, publicId, originFileObj }
  const [fileList, setFileList] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Categories for Select
  const [categories, setCategories] = useState([]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        if (res.success) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Load initial data
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Fill form data
        form.setFieldsValue({
          name: initialData.name,
          description: initialData.description,
          price: initialData.price,
          originalPrice: initialData.originalPrice,
          stock: initialData.stock,
          category: initialData.category?._id || initialData.category, // handle populated object or ID
          status: initialData.status,
          isHot: initialData.isHot,
          isNewProduct: initialData.isNewProduct
        });

        // Fill images
        if (initialData.images && initialData.images.length > 0) {
          const formattedImages = initialData.images.map((img, index) => ({
            uid: `-${index}`,
            name: `image-${index}.png`,
            status: 'done',
            url: img.url,
            publicId: img.publicId
          }));
          setFileList(formattedImages);
        } else {
          setFileList([]);
        }
      } else {
        // Reset form for create
        form.resetFields();
        form.setFieldsValue({
          status: 'active',
          isNewProduct: true,
          stock: 0
        });
        setFileList([]);
      }
    }
  }, [open, initialData, form]);

  // Handle File Upload Check
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Bạn chỉ có thể upload file ảnh!');
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Kích thước ảnh phải nhỏ hơn 10MB!');
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent auto upload
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

  // Form Submit
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Process images
      // 1. Filter existing images (already have url & publicId)
      const existingImages = fileList.filter(f => f.url && f.publicId).map(f => ({
        url: f.url,
        publicId: f.publicId
      }));

      // 2. Upload new images
      const newFiles = fileList.filter(f => f.originFileObj);
      const uploadedImages = [];

      if (newFiles.length > 0) {
        setUploading(true);
        // Upload sequentially or parallel
        // Using Promise.all for parallel upload
        const uploadPromises = newFiles.map(file => uploadService.uploadImage(file.originFileObj));

        try {
          const results = await Promise.all(uploadPromises);
          results.forEach(res => {
            if (res.success) {
              uploadedImages.push({
                url: res.imageUrl,
                publicId: res.publicId
              });
            }
          });
        } catch (err) {
          console.error("Upload error", err);
          message.error("Có lỗi khi upload ảnh");
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Combine images
      const finalImages = [...existingImages, ...uploadedImages];

      // Prepare payload
      const productData = {
        ...values,
        images: finalImages
      };

      await onSuccess(productData);

      // Cleanup
      form.resetFields();
      setFileList([]);
      onCancel();

    } catch (error) {
      console.error("Submit error", error);
      message.error("Có lỗi xảy ra khi lưu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <PictureOutlined className="text-xl text-brand-500" />
            <span className="text-xl font-bold text-navy-700">
              {initialData ? "Cập nhật sản phẩm" : "Thêm mới sản phẩm"}
            </span>
          </div>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={800}
        centered
        destroyOnClose
        className="product-modal"
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <Form.Item
              label="Tên sản phẩm"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
              className="col-span-2"
            >
              <Input placeholder="Ví dụ: Bó Hoa Hồng Đỏ..." size="large" className="rounded-lg" />
            </Form.Item>

            {/* Category */}
            <Form.Item
              label="Danh mục"
              name="category"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
            >
              <Select placeholder="Chọn danh mục" size="large" className="rounded-lg">
                {categories.map(cat => (
                  <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>

            {/* Status */}
            <Form.Item
              label="Trạng thái"
              name="status"
            >
              <Select size="large" className="rounded-lg">
                <Option value="active">Đang bán</Option>
                <Option value="inactive">Ngừng bán</Option>
                <Option value="out_of_stock">Hết hàng</Option>
              </Select>
            </Form.Item>

            {/* Price */}
            <Form.Item
              label="Giá bán (VNĐ)"
              name="price"
              rules={[{ required: true, message: 'Vui lòng nhập giá bán!' }]}
            >
              <InputNumber
                className="w-full rounded-lg"
                size="large"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
              />
            </Form.Item>

            {/* Original Price */}
            <Form.Item
              label="Giá gốc (VNĐ)"
              name="originalPrice"
            >
              <InputNumber
                className="w-full rounded-lg"
                size="large"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
                placeholder="Để trống nếu không giảm giá"
              />
            </Form.Item>

            {/* Stock */}
            <Form.Item
              label="Tồn kho"
              name="stock"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
            >
              <InputNumber className="w-full rounded-lg" size="large" min={0} />
            </Form.Item>

            {/* Flags */}
            <div className="flex gap-8 items-center mt-2">
              <Form.Item name="isHot" valuePropName="checked" noStyle>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Switch /> <span>Sản phẩm HOT</span>
                </div>
              </Form.Item>
              <Form.Item name="isNewProduct" valuePropName="checked" noStyle>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Switch defaultChecked /> <span>Sản phẩm Mới</span>
                </div>
              </Form.Item>
            </div>
          </div>

          <Form.Item label="Mô tả chi tiết" name="description" className="mt-4">
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết về sản phẩm..." className="rounded-lg" />
          </Form.Item>

          <Divider orientation="left">Hình ảnh sản phẩm</Divider>

          <Form.Item>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleUploadChange}
              beforeUpload={beforeUpload}
              accept="image/*"
              multiple={true}
            >
              {fileList.length >= 8 ? null : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <PlusOutlined />
                  <div className="mt-2">Tải ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>


          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button onClick={onCancel} size="large" className="rounded-lg">
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || uploading}
              size="large"
              className="bg-brand-500 rounded-lg font-medium"
            >
              {initialData ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => setPreviewOpen(false)} centered>
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default CreateProductModal;