import React, { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, InputNumber, Divider, List, Avatar, message } from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const CreateOrderModal = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState([]);

  // --- Dữ liệu giả sản phẩm để chọn ---
  const mockProducts = [
    { id: 1, name: 'Bó Hoa Hồng Đỏ', price: 550000, img: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=64&q=80' },
    { id: 2, name: 'Lẵng Hoa Khai Trương', price: 1200000, img: 'https://images.unsplash.com/photo-1597826368522-9f4a53586d0e?auto=format&fit=crop&w=64&q=80' },
    { id: 3, name: 'Hộp Hoa Baby Blue', price: 450000, img: 'https://images.unsplash.com/photo-1523694576728-a3672d5b61b4?auto=format&fit=crop&w=64&q=80' },
  ];

  // Hàm thêm sản phẩm vào đơn
  const handleAddProduct = (productId) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) return;

    const existItem = selectedProducts.find(item => item.id === productId);
    if (existItem) {
      setSelectedProducts(prev => prev.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  // Hàm xóa sản phẩm
  const handleRemoveProduct = (id) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== id));
  };

  // Tính tổng tiền
  const totalAmount = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleOk = () => {
    form.validateFields().then(values => {
      if (selectedProducts.length === 0) {
        message.error('Vui lòng chọn ít nhất 1 sản phẩm!');
        return;
      }
      
      const newOrder = {
        ...values,
        products: selectedProducts,
        total: totalAmount,
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'Pending',
        id: `#ORD-${Math.floor(Math.random() * 10000)}`
      };

      onCreate(newOrder);
      form.resetFields();
      setSelectedProducts([]);
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  return (
    <Modal
      title={<span className="text-xl font-bold text-navy-700">Tạo Đơn Hàng Mới</span>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={1000}
      okText="Tạo Đơn"
      cancelText="Hủy"
      centered
      className="custom-modal-metrix"
    >
      <Form form={form} layout="vertical" className="mt-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* --- CỘT TRÁI: THÔNG TIN KHÁCH HÀNG --- */}
          <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2">Thông tin khách hàng</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="customerName" label="Tên khách hàng" rules={[{ required: true, message: 'Nhập tên khách!' }]}>
                <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT!' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="0909..." className="rounded-xl" />
              </Form.Item>
            </div>

            <Form.Item name="address" label="Địa chỉ giao hàng" rules={[{ required: true, message: 'Nhập địa chỉ!' }]}>
              <Input prefix={<EnvironmentOutlined />} placeholder="Số nhà, đường, phường, quận..." className="rounded-xl" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
               <Form.Item name="deliveryTime" label="Thời gian giao" rules={[{ required: true }]}>
                 <DatePicker showTime className="w-full rounded-xl" placeholder="Chọn ngày giờ" />
               </Form.Item>
               <Form.Item name="paymentMethod" label="Thanh toán" initialValue="COD">
                 <Select className="rounded-xl">
                   <Option value="COD">Tiền mặt (COD)</Option>
                   <Option value="VNPAY">VNPAY</Option>
                   <Option value="BANK">Chuyển khoản</Option>
                 </Select>
               </Form.Item>
            </div>

            <Form.Item name="note" label="Ghi chú đơn hàng">
              <TextArea rows={3} placeholder="Lời nhắn trên thiệp hoặc lưu ý giao hàng..." className="rounded-xl" />
            </Form.Item>
          </div>

          {/* --- CỘT PHẢI: CHỌN SẢN PHẨM --- */}
          <div className="bg-gray-50 p-5 rounded-2xl">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2 flex justify-between items-center">
              <span>Giỏ hàng</span>
              <ShoppingOutlined className="text-lg" />
            </h4>

            {/* Select chọn nhanh sản phẩm */}
            <div className="mb-4">
               <Select 
                 showSearch
                 placeholder="Tìm và thêm sản phẩm..."
                 className="w-full"
                 onChange={handleAddProduct}
                 filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                 value={null} // Reset sau khi chọn
               >
                 {mockProducts.map(p => (
                   <Option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString()}đ</Option>
                 ))}
               </Select>
            </div>

            {/* Danh sách sản phẩm đã chọn */}
            <div className="h-[250px] overflow-y-auto pr-2">
              <List
                itemLayout="horizontal"
                dataSource={selectedProducts}
                renderItem={(item) => (
                  <List.Item 
                    className="bg-white p-3 mb-2 rounded-xl shadow-sm border border-gray-100"
                    actions={[
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleRemoveProduct(item.id)} 
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.img} shape="square" size={48} className="rounded-lg" />}
                      title={<span className="text-sm font-medium">{item.name}</span>}
                      description={
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-brand-500 font-bold">{item.price.toLocaleString()}đ</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-md">x{item.quantity}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
              {selectedProducts.length === 0 && (
                <div className="text-center text-gray-400 mt-10">Chưa có sản phẩm nào</div>
              )}
            </div>

            <Divider className="my-3" />

            {/* Tổng tiền */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Tổng cộng:</span>
              <span className="text-2xl font-bold text-brand-500">{totalAmount.toLocaleString()} ₫</span>
            </div>
          </div>

        </div>
      </Form>
    </Modal>
  );
};

export default CreateOrderModal;