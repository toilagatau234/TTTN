import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Upload, Button, message, Row, Col, Switch, Divider, Card, Breadcrumb } from 'antd';
import { 
  UploadOutlined, PlusOutlined, LoadingOutlined, DollarOutlined, 
  BarcodeOutlined, SaveOutlined, ArrowLeftOutlined, FileImageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const CreateProduct = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
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

  // --- XỬ LÝ LƯU SẢN PHẨM ---
  const onFinish = async (values) => {
    try {
      setLoading(true);
      // Giả lập gọi API (Sau này dùng productService.add(values))
      console.log('Success:', values);
      
      setTimeout(() => {
        message.success('Tạo sản phẩm mới thành công!');
        setLoading(false);
        navigate('/admin/products'); // Quay về trang danh sách
      }, 1000);
      
    } catch (error) {
      console.log('Failed:', error);
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Thêm ảnh</div>
    </div>
  );

  return (
    <div className="w-full">
      {/* --- HEADER TÁC VỤ --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col gap-1">
            <Breadcrumb>
              <Breadcrumb.Item onClick={() => navigate('/admin/products')} className="cursor-pointer hover:text-brand-500">
                 Sản phẩm
              </Breadcrumb.Item>
              <Breadcrumb.Item>Thêm mới</Breadcrumb.Item>
            </Breadcrumb>
            <h2 className="text-2xl font-bold text-navy-700 m-0">Tạo sản phẩm mới</h2>
        </div>
        
        <div className="flex gap-3">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/admin/products')}
            className="rounded-xl h-[44px] px-6 border-gray-300 text-gray-600 hover:text-navy-700 hover:border-navy-700 font-medium"
          >
            Hủy bỏ
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={() => form.submit()}
            loading={loading}
            className="rounded-xl h-[44px] px-6 bg-brand-500 border-none font-bold shadow-brand-500/50 hover:bg-brand-600"
          >
            Lưu sản phẩm
          </Button>
        </div>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish}
        initialValues={{ stock: 100, status: true, category: 'Hoa Hồng' }}
      >
        <Row gutter={24}>
          
          {/* --- CỘT TRÁI (THÔNG TIN CHÍNH) --- */}
          <Col span={24} lg={16}>
            
            {/* Card 1: Thông tin chung */}
            <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Thông tin chung</span>}>
              <Form.Item 
                name="name" 
                label="Tên sản phẩm" 
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
              >
                <Input placeholder="Ví dụ: Bó Hoa Hồng Đỏ Valentine 99 Bông" className="rounded-xl h-[44px] text-base" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả sản phẩm">
                <TextArea 
                  rows={6} 
                  placeholder="Mô tả chi tiết về ý nghĩa, hướng dẫn chăm sóc..." 
                  className="rounded-xl p-3 text-base" 
                />
              </Form.Item>
            </Card>

            {/* Card 2: Giá cả & Kho hàng */}
            <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Dữ liệu sản phẩm</span>}>
               <Row gutter={24}>
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
                        placeholder="0"
                        prefix={<DollarOutlined className="text-gray-400 mr-2" />}
                      />
                    </Form.Item>
                 </Col>
                 <Col span={12}>
                    <Form.Item name="salePrice" label="Giá khuyến mãi">
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

               <Row gutter={24}>
                 <Col span={12}>
                    <Form.Item name="sku" label="Mã SKU">
                       <Input prefix={<BarcodeOutlined className="text-gray-400" />} placeholder="PROD-001" className="rounded-xl h-[44px]" />
                    </Form.Item>
                 </Col>
                 <Col span={12}>
                    <Form.Item name="stock" label="Số lượng tồn kho" rules={[{ required: true }]}>
                       <InputNumber min={0} className="w-full rounded-xl h-[44px] flex items-center pt-1" />
                    </Form.Item>
                 </Col>
               </Row>
            </Card>

          </Col>

          {/* --- CỘT PHẢI (SIDEBAR) --- */}
          <Col span={24} lg={8}>
            
            {/* Card 3: Media */}
            <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Hình ảnh</span>}>
               <Form.Item name="avatar" noStyle>
                 <div className="text-center mb-4">
                   <Upload
                      name="avatar"
                      listType="picture-card"
                      className="avatar-uploader w-full h-[250px] overflow-hidden rounded-xl border-dashed border-2 border-gray-300 hover:border-brand-500 transition-colors bg-gray-50 flex justify-center items-center"
                      showUploadList={false}
                      beforeUpload={() => false}
                      onChange={handleAvatarChange}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          {loading ? <LoadingOutlined className="text-3xl mb-2" /> : <FileImageOutlined className="text-4xl mb-3" />}
                          <div className="font-medium">Kéo thả hoặc chọn ảnh chính</div>
                        </div>
                      )}
                    </Upload>
                 </div>
               </Form.Item>
               
               <p className="font-medium text-gray-500 mb-2">Ảnh chi tiết (Gallery)</p>
               <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  beforeUpload={() => false}
                  multiple
                >
                  {fileList.length >= 5 ? null : uploadButton}
                </Upload>
            </Card>

            {/* Card 4: Tổ chức */}
            <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Phân loại</span>}>
                <Form.Item name="status" valuePropName="checked" className="mb-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                     <span className="font-medium text-gray-600">Đang hoạt động</span>
                     <Switch />
                  </div>
                </Form.Item>

                <Form.Item name="categories" label="Danh mục" rules={[{ required: true }]}>
                  <Select mode="multiple" placeholder="Chọn các danh mục" className="h-[44px] custom-select-metrix rounded-xl text-base">
                    <Option value="Hoa Hồng">Hoa Hồng</Option>
                    <Option value="Hoa Lan">Hoa Lan</Option>
                    <Option value="Hoa Sinh Nhật">Hoa Sinh Nhật</Option>
                    <Option value="Hoa Khai Trương">Hoa Khai Trương</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="tags" label="Thẻ Tags">
                   <Select mode="tags" placeholder="Nhập tags..." className="h-[44px] custom-select-metrix rounded-xl" tokenSeparators={[',']}>
                      <Option value="Mới">Mới</Option>
                      <Option value="Bán chạy">Bán chạy</Option>
                      <Option value="Hot">Hot</Option>
                   </Select>
                </Form.Item>
            </Card>
          </Col>

        </Row>
      </Form>
    </div>
  );
};

export default CreateProduct;