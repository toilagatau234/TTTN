import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, Button, message, Row, Col } from 'antd';
import { UploadOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const CreateProductModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); // Để hiển thị preview ảnh

  // Giả lập danh mục (Sau này gọi API lấy về)
  const categories = [
    { id: 1, name: 'Hoa Hồng' },
    { id: 2, name: 'Hoa Lan' },
    { id: 3, name: 'Hoa Cưới' },
    { id: 4, name: 'Hoa Khai Trương' },
  ];

  const handleUploadChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done' || info.file.originFileObj) {
      // Demo: Đọc file ảnh để hiển thị preview ngay lập tức
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageUrl(reader.result));
      reader.readAsDataURL(info.file.originFileObj);
      setLoading(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Giả lập dữ liệu trả về
      const newProduct = {
        key: Date.now(),
        ...values,
        id: `#PROD-${Math.floor(Math.random() * 9999)}`,
        image: imageUrl || 'https://via.placeholder.com/150', // Dùng ảnh placeholder nếu chưa up
        sales: 0,
        status: values.stock > 0 ? 'In Stock' : 'Out of Stock'
      };

      onCreate(newProduct);
      form.resetFields();
      setImageUrl(null);
      message.success('Thêm sản phẩm thành công!');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Thêm Sản Phẩm Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      okText="Lưu Sản Phẩm"
      cancelText="Hủy"
      centered
      className="custom-modal-metrix"
    >
      <Form form={form} layout="vertical" className="mt-5">
        <Row gutter={24}>
          {/* CỘT TRÁI: ẢNH SẢN PHẨM */}
          <Col span={8}>
            <Form.Item label="Hình ảnh sản phẩm">
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                onChange={handleUploadChange}
                beforeUpload={() => false} // Chặn auto upload để xử lý tay
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="product" style={{ width: '100%', borderRadius: '10px' }} />
                ) : (
                  <div className="flex flex-col items-center">
                    {loading ? <LoadingOutlined /> : <PlusOutlined />}
                    <div className="mt-2 text-gray-400">Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>

          {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
          <Col span={16}>
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Nhập tên hoa!' }]}>
              <Input placeholder="Ví dụ: Bó Hoa Hồng Đỏ..." className="rounded-xl h-[40px]" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
                  <Select placeholder="Chọn loại hoa" className="rounded-xl h-[40px] custom-select-metrix">
                    {categories.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="price" label="Giá bán (VNĐ)" rules={[{ required: true }]}>
                  <InputNumber 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    className="rounded-xl h-[40px] pt-1"
                    placeholder="500,000"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="stock" label="Số lượng tồn kho" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} className="rounded-xl h-[40px] pt-1" placeholder="100" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Trạng thái" initialValue="In Stock">
                  <Select className="rounded-xl h-[40px] custom-select-metrix">
                    <Option value="In Stock">Còn hàng</Option>
                    <Option value="Out of Stock">Hết hàng</Option>
                    <Option value="Hidden">Ẩn</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        <Form.Item name="description" label="Mô tả chi tiết">
          <TextArea rows={4} placeholder="Mô tả về ý nghĩa loài hoa, hướng dẫn chăm sóc..." className="rounded-xl" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateProductModal;