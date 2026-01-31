import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, Button, message, Row, Col, Switch, Divider } from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  LoadingOutlined,
  DollarOutlined,
  BarcodeOutlined,
  TagOutlined,
  FileImageOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const CreateProductModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); 
  const [fileList, setFileList] = useState([]);   

  // --- XỬ LÝ UPLOAD ẢNH ĐẠI DIỆN ---
  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => setImageUrl(reader.result));
    reader.readAsDataURL(info.file.originFileObj);
    setLoading(false);
  };

  // --- XỬ LÝ KHI BẤM LƯU ---
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Giả lập dữ liệu sản phẩm mới
      const newProduct = {
        key: Date.now(),
        id: `#PROD-${Math.floor(Math.random() * 9999)}`,
        ...values,
        image: imageUrl || 'https://via.placeholder.com/150', // Dùng ảnh placeholder nếu không up
        sales: 0,
        status: values.stock > 0 ? (values.isPublished ? 'In Stock' : 'Hidden') : 'Out of Stock'
      };

      onCreate(newProduct);
      
      form.resetFields();
      setImageUrl(null);
      setFileList([]);
      message.success('Thêm sản phẩm thành công!');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Thêm ảnh</div>
    </div>
  );

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Thêm Sản Phẩm Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={950} 
      okText="Lưu Sản Phẩm"
      cancelText="Hủy Bỏ"
      centered
      className="custom-modal-metrix"
      maskClosable={false}
    >
      <Form 
        form={form} 
        layout="vertical" 
        className="mt-6"
        initialValues={{ 
            stock: 100, 
            status: 'In Stock', 
            isPublished: true,
            category: 'Hoa Hồng' 
        }}
      >
        <Row gutter={32}>
          
          {/* --- CỘT TRÁI: QUẢN LÝ MEDIA --- */}
          <Col span={8} className="border-r border-gray-100 pr-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <FileImageOutlined /> Hình ảnh
            </h4>
            
            {/* Ảnh Đại Diện */}
            <Form.Item label="Ảnh đại diện" className="text-center mb-6">
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader w-full h-[220px] overflow-hidden rounded-xl border-dashed border-2 border-gray-300 hover:border-brand-500 transition-colors bg-gray-50"
                showUploadList={false}
                beforeUpload={() => false} 
                onChange={handleAvatarChange}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    {loading ? <LoadingOutlined className="text-3xl mb-2" /> : <PlusOutlined className="text-3xl mb-2" />}
                    <div className="font-medium text-sm">Chọn ảnh chính</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            {/* Ảnh Chi Tiết */}
            <Form.Item label="Ảnh chi tiết (Gallery)">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                beforeUpload={() => false}
                multiple
                className="custom-upload-list"
              >
                {fileList.length >= 5 ? null : uploadButton}
              </Upload>
            </Form.Item>
          </Col>

          {/* --- CỘT PHẢI: THÔNG TIN CHI TIẾT --- */}
          <Col span={16} className="pl-4">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <TagOutlined /> Thông tin chi tiết
            </h4>

            {/* Tên sản phẩm */}
            <Form.Item 
                name="name" 
                label="Tên sản phẩm" 
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
            >
              <Input placeholder="Ví dụ: Bó Hoa Hồng Đỏ Valentine 99 Bông" className="rounded-xl h-[44px] text-base" />
            </Form.Item>

            {/* Giá & Giá khuyến mãi */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                    name="price" 
                    label="Giá bán (VNĐ)" 
                    rules={[{ required: true, message: 'Nhập giá bán!' }]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    className="rounded-xl h-[44px] flex items-center pt-1 font-bold text-navy-700"
                    placeholder="500,000"
                    prefix={<DollarOutlined className="text-gray-400 mr-2" />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="salePrice" label="Giá khuyến mãi (Tùy chọn)">
                  <InputNumber 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    className="rounded-xl h-[44px] flex items-center pt-1"
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Danh mục & Mã SKU */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục!' }]}>
                  <Select placeholder="Chọn loại hoa" className="h-[44px] custom-select-metrix rounded-xl text-base">
                    <Option value="Hoa Hồng">Hoa Hồng</Option>
                    <Option value="Hoa Lan">Hoa Lan</Option>
                    <Option value="Hoa Sinh Nhật">Hoa Sinh Nhật</Option>
                    <Option value="Hoa Khai Trương">Hoa Khai Trương</Option>
                    <Option value="Hoa Cưới">Hoa Cưới</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                 <Form.Item name="sku" label="Mã SKU (Mã kho)">
                   <Input prefix={<BarcodeOutlined className="text-gray-400" />} placeholder="PROD-001" className="rounded-xl h-[44px]" />
                 </Form.Item>
              </Col>
            </Row>

            {/* Tồn kho & Tags */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="stock" label="Tồn kho" rules={[{ required: true }]}>
                   <InputNumber min={0} className="w-full rounded-xl h-[44px] flex items-center pt-1" />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item name="tags" label="Thẻ Tags (SEO)">
                   <Select mode="tags" placeholder="Nhập tag rồi Enter" className="h-[44px] custom-select-metrix rounded-xl" tokenSeparators={[',']}>
                      <Option value="Mới">Mới</Option>
                      <Option value="Bán chạy">Bán chạy</Option>
                      <Option value="Hot Trend">Hot Trend</Option>
                   </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Mô tả sản phẩm">
              <TextArea rows={4} placeholder="Mô tả chi tiết về ý nghĩa, hướng dẫn chăm sóc..." className="rounded-xl p-3" />
            </Form.Item>
            
            <Divider className="my-4" />

            {/* Switch Trạng thái */}
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
               <span className="font-bold text-navy-700">Trạng thái hiển thị</span>
               <Form.Item name="isPublished" valuePropName="checked" className="mb-0">
                  <Switch checkedChildren="Đang bán" unCheckedChildren="Ẩn tin" defaultChecked />
               </Form.Item>
            </div>

          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateProductModal;