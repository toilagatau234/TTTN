import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, Table, InputNumber, message, Space, Typography, Divider } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined, 
  ShopOutlined,
  FileTextOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';
import productService from '../../../services/productService';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const CreateImport = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Watch values for live calculation
  const items = Form.useWatch('items', form);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [supplierRes, productRes] = await Promise.all([
          inventoryService.getSuppliers({ limit: 100 }),
          productService.getAll({ limit: 200 })
        ]);
        
        if (supplierRes.success) setSuppliers(supplierRes.data);
        if (productRes.success) setProducts(productRes.data);
      } catch (error) {
        message.error('Lỗi tải dữ liệu cơ sở!');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tính tổng tiền tự động
  const calculateTotal = () => {
    if (!items) return 0;
    return items.reduce((sum, item) => {
      const q = item?.quantity || 0;
      const p = item?.unitPrice || 0;
      return sum + (q * p);
    }, 0);
  };

  const totalAmount = calculateTotal();

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        totalAmount
      };
      
      const res = await inventoryService.createImport(payload);
      if (res.success) {
        message.success('Tạo phiếu nhập hàng thành công!');
        navigate('/admin/inventory');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu phiếu nhập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/admin/inventory')} 
            shape="circle" 
          />
          <Title level={2} className="!text-navy-700 !m-0">Tạo Phiếu Nhập Hàng</Title>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          loading={submitting}
          onClick={() => form.submit()} 
          className="bg-brand-500 rounded-xl h-[40px] px-8 font-bold border-none shadow-md hover:!bg-pink-600"
        >
          Lưu Phiếu Nhập
        </Button>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish}
        initialValues={{ items: [{ productId: null, quantity: 1, unitPrice: 0 }] }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: THÔNG TIN CHUNG */}
          <div className="lg:col-span-1 space-y-6">
            <Card 
              title={<span className="text-navy-700 font-bold"><ShopOutlined className="mr-2"/>Thông tin nguồn hàng</span>}
              className="rounded-[20px] shadow-sm border-none"
            >
              <Form.Item 
                name="supplierId" 
                label="Nhà cung cấp" 
                rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp' }]}
              >
                <Select 
                  placeholder="Chọn nhà cung cấp" 
                  className="rounded-lg"
                  showSearch
                  optionFilterProp="children"
                >
                  {suppliers.map(s => (
                    <Option key={s._id} value={s._id}>{s.name} - {s.phone}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="notes" label="Ghi chú phiếu nhập">
                <TextArea 
                  rows={4} 
                  placeholder="Nhập ghi chú (VD: Hàng nhập bổ sung dịp lễ...)" 
                  className="rounded-xl"
                />
              </Form.Item>
            </Card>

            <Card className="rounded-[20px] shadow-sm border-none bg-brand-50/30">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-brand-500 font-bold uppercase text-xs tracking-wider">
                  <DollarCircleOutlined /> 
                  Tóm tắt thanh toán
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between items-center">
                  <Text className="text-gray-500">Tổng số mặt hàng:</Text>
                  <Text className="font-bold">{items?.length || 0}</Text>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Text className="text-gray-500 text-lg">Tổng cộng:</Text>
                  <Title level={3} className="!text-pink-600 !m-0">
                    {totalAmount.toLocaleString('vi-VN')} đ
                  </Title>
                </div>
              </div>
            </Card>
          </div>

          {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM */}
          <div className="lg:col-span-2">
            <Card 
              title={<span className="text-navy-700 font-bold"><FileTextOutlined className="mr-2"/>Chi tiết danh sách nhập</span>}
              extra={null}
              className="rounded-[20px] shadow-sm border-none min-h-[500px]"
            >
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    <Table
                      dataSource={fields}
                      pagination={false}
                      className="custom-table-metrix"
                      locale={{ emptyText: 'Chưa có sản phẩm nào được chọn' }}
                      columns={[
                        {
                          title: 'Sản phẩm',
                          key: 'product',
                          width: '45%',
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, 'productId']}
                              fieldKey={[field.fieldKey, 'productId']}
                              rules={[{ required: true, message: 'Chọn SP' }]}
                              className="!mb-0"
                            >
                              <Select 
                                placeholder="Tìm và chọn sản phẩm" 
                                showSearch
                                optionFilterProp="children"
                                className="w-full"
                              >
                                {products.map(p => (
                                  <Option key={p._id} value={p._id}>{p.name} (Hiện có: {p.stock})</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          )
                        },
                        {
                          title: 'Số lượng',
                          key: 'quantity',
                          width: '20%',
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, 'quantity']}
                              fieldKey={[field.fieldKey, 'quantity']}
                              rules={[{ required: true, message: 'Nhập SL' }]}
                              className="!mb-0"
                            >
                              <InputNumber min={1} placeholder="SL" className="w-full rounded-md" />
                            </Form.Item>
                          )
                        },
                        {
                          title: 'Đơn giá nhập',
                          key: 'unitPrice',
                          width: '25%',
                          render: (_, field) => (
                            <Form.Item
                              name={[field.name, 'unitPrice']}
                              fieldKey={[field.fieldKey, 'unitPrice']}
                              rules={[{ required: true, message: 'Nhập giá' }]}
                              className="!mb-0"
                            >
                              <InputNumber 
                                min={0} 
                                step={1000}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                placeholder="Giá nhập" 
                                className="w-full rounded-md" 
                              />
                            </Form.Item>
                          )
                        },
                        {
                          title: '',
                          key: 'action',
                          width: '10%',
                          render: (_, field) => (
                            <Button 
                              type="text" 
                              danger 
                              icon={<DeleteOutlined />} 
                              onClick={() => remove(field.name)} 
                            />
                          )
                        }
                      ]}
                    />
                    
                    <Button 
                      type="dashed" 
                      onClick={() => add({ productId: null, quantity: 1, unitPrice: 0 })} 
                      block 
                      icon={<PlusOutlined />}
                      className="h-12 border-brand-200 text-brand-500 hover:!text-brand-600 hover:!border-brand-500 bg-white rounded-xl font-medium"
                    >
                      Thêm dòng sản phẩm mới
                    </Button>
                  </div>
                )}
              </Form.List>
            </Card>
          </div>

        </div>
      </Form>
    </div>
  );
};

export default CreateImport;
