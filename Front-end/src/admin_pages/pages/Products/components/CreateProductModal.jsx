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
          isNewProduct: initialData.isNewProduct,
          // AI Attributes
          occasion: initialData.occasion,
          style: initialData.style,
          main_flowers: initialData.main_flowers,
          sub_flowers: initialData.sub_flowers,
          dominant_color: initialData.dominant_color,
          secondary_colors: initialData.secondary_colors,
          layout: initialData.layout,
          elements: initialData.elements
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
        destroyOnHidden
        className="product-modal"
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4 space-y-6">
          
          {/* Section 1: Thông tin cơ bản */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-brand-500 rounded-full"></div>
              <span className="font-bold text-navy-700">Thông tin cơ bản</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/40 p-4 rounded-2xl border border-gray-100/70">
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
                className="col-span-2 mb-1"
              >
                <Input placeholder="Ví dụ: Bó Hoa Hồng Đỏ..." size="large" className="rounded-xl border-gray-200 bg-white" />
              </Form.Item>

              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                className="mb-1"
              >
                <Select placeholder="Chọn danh mục" size="large" className="rounded-xl">
                  {categories.map(cat => (
                    <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Trạng thái"
                name="status"
                className="mb-1"
              >
                <Select size="large" className="rounded-xl">
                  <Option value="active">Đang bán</Option>
                  <Option value="inactive">Ngừng bán</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* Section 2: Giá và Kho hàng */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-green-500 rounded-full"></div>
              <span className="font-bold text-navy-700">Giá & Kho hàng</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/40 p-4 rounded-2xl border border-gray-100/70">
              <Form.Item
                label="Giá bán (VNĐ)"
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán!' }]}
                className="mb-1"
              >
                <InputNumber
                  className="w-full rounded-xl border-gray-200"
                  size="large"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                />
              </Form.Item>

              <Form.Item
                label="Giá gốc (VNĐ)"
                name="originalPrice"
                className="mb-1"
              >
                <InputNumber
                  className="w-full rounded-xl border-gray-200"
                  size="large"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                  placeholder="Không giảm giá"
                />
              </Form.Item>

              <Form.Item
                label="Tồn kho"
                name="stock"
                rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                className="mb-1"
                tooltip={initialData ? "Để đảm bảo quy trình kiểm toán, vui lòng sử dụng chức năng 'Kiểm Kê / Báo Hủy' để thay đổi số lượng tồn kho." : undefined}
              >
                <InputNumber 
                  className="w-full rounded-xl border-gray-200" 
                  size="large" 
                  min={0} 
                  disabled={!!initialData}
                />
              </Form.Item>
            </div>
          </div>

          {/* Section 3: Đặc tính & Mô tả */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
              <span className="font-bold text-navy-700">Đặc tính & Mô tả</span>
            </div>
            <div className="bg-gray-50/40 p-4 rounded-2xl border border-gray-100/70 flex flex-col gap-4">
              <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100/50 shadow-sm w-fit">
                <div className="flex items-center gap-2">
                  <Form.Item name="isHot" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                  <span className="text-sm font-semibold text-red-500 flex items-center gap-1">
                    🔥 Sản phẩm HOT
                  </span>
                </div>
                <div className="w-[1px] h-4 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <Form.Item name="isNewProduct" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                  <span className="text-sm font-semibold text-blue-500 flex items-center gap-1">
                    ✨ Sản phẩm mới
                  </span>
                </div>
              </div>

              <Form.Item 
                label={<span className="font-medium text-gray-700">Mô tả chi tiết</span>} 
                name="description" 
                rules={[{ required: true, message: 'Vui lòng nhập mô tả sản phẩm!' }]}
                className="mb-0"
              >
                <Input.TextArea rows={4} placeholder="Mô tả chi tiết về sản phẩm..." className="rounded-xl border-gray-200" />
              </Form.Item>
            </div>
          </div>
          
          {/* Section 4: Phân loại AI (Mới) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
              <span className="font-bold text-navy-700">Phân loại AI (AI Matching)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/40 p-4 rounded-2xl border border-gray-100/70">
              <Form.Item label="Dịp tặng (Occasions)" name="occasion" className="mb-1">
                <Select mode="tags" placeholder="Ví dụ: Birthday, Anniversary..." size="large" className="rounded-xl" />
              </Form.Item>

              <Form.Item label="Phong cách (Styles)" name="style" className="mb-1">
                <Select mode="tags" placeholder="Ví dụ: Luxury, Vintage, Minimalist..." size="large" className="rounded-xl" />
              </Form.Item>

              <Form.Item label="Hoa chính (Main Flowers)" name="main_flowers" className="mb-1">
                <Select mode="tags" placeholder="Ví dụ: Rose, Tulip, Lily..." size="large" className="rounded-xl" />
              </Form.Item>

              <Form.Item label="Hoa phụ & Lá (Sub Flowers)" name="sub_flowers" className="mb-1">
                <Select mode="tags" placeholder="Ví dụ: Baby Breath, Eucalyptus..." size="large" className="rounded-xl" />
              </Form.Item>

              <Form.Item label="Màu chủ đạo" name="dominant_color" className="mb-1">
                <Select placeholder="Chọn màu chủ đạo" size="large" className="rounded-xl">
                  <Option value="red">Đỏ (Red)</Option>
                  <Option value="pink">Hồng (Pink)</Option>
                  <Option value="white">Trắng (White)</Option>
                  <Option value="yellow">Vàng (Yellow)</Option>
                  <Option value="orange">Cam (Orange)</Option>
                  <Option value="purple">Tím (Purple)</Option>
                  <Option value="blue">Xanh dương (Blue)</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Màu phối hợp" name="secondary_colors" className="mb-1">
                <Select mode="tags" placeholder="Chọn các màu phối" size="large" className="rounded-xl" />
              </Form.Item>

              <Form.Item label="Bố cục (Layout)" name="layout" className="mb-1">
                <Select placeholder="Chọn bố cục" size="large" className="rounded-xl">
                  <Option value="round">Tròn (Round)</Option>
                  <Option value="heart">Trái tim (Heart)</Option>
                  <Option value="cascade">Dòng thác (Cascade)</Option>
                  <Option value="one-sided">Một mặt (One-sided)</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Yếu tố trang trí" name="elements" className="mb-1">
                <Select mode="tags" placeholder="Ví dụ: Ribbon, Box, Pearl..." size="large" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>

          <Divider titlePlacement="left">Hình ảnh sản phẩm</Divider>

          <Form.Item className="mb-0">
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