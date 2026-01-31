import React, { useState } from 'react';
import { Card, Form, Select, DatePicker, InputNumber, Button, Table, Input, message, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const CreateImport = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // State lưu danh sách sản phẩm trong phiếu nhập
  const [products, setProducts] = useState([]);
  
  // Dữ liệu sản phẩm giả lập để chọn 
  const mockProducts = [
    { id: '1', name: 'Hoa Hồng Đỏ', stock: 50 },
    { id: '2', name: 'Hoa Lan Vàng', stock: 10 },
    { id: '3', name: 'Giấy Gói Cao Cấp', stock: 100 },
  ];

  // Hàm thêm dòng sản phẩm
  const handleAddProduct = () => {
    const newRow = { key: Date.now(), productId: null, quantity: 1, cost: 0, total: 0 };
    setProducts([...products, newRow]);
  };

  const handleRemoveProduct = (key) => {
    setProducts(products.filter(item => item.key !== key));
  };

  // Hàm update giá trị trên dòng
  const handleRowChange = (key, field, value) => {
    const updatedProducts = products.map(item => {
      if (item.key === key) {
        const newItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'cost') {
          newItem.total = newItem.quantity * newItem.cost;
        }
        return newItem;
      }
      return item;
    });
    setProducts(updatedProducts);
  };

  // Tính tổng tiền phiếu nhập
  const totalAmount = products.reduce((sum, item) => sum + item.total, 0);

  const onFinish = (values) => {
    if (products.length === 0) return message.error('Vui lòng nhập ít nhất 1 sản phẩm!');
    
    console.log('Phiếu nhập:', { ...values, products, totalAmount });
    message.success('Tạo phiếu nhập hàng thành công!');
    setTimeout(() => navigate('/admin/inventory'), 1000);
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productId',
      width: '30%',
      render: (text, record) => (
        <Select 
          placeholder="Chọn hàng hóa" 
          style={{ width: '100%' }}
          onChange={(val) => handleRowChange(record.key, 'productId', val)}
        >
           {mockProducts.map(p => <Option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock})</Option>)}
        </Select>
      )
    },
    {
      title: 'Số lượng nhập',
      dataIndex: 'quantity',
      render: (val, record) => (
        <InputNumber min={1} value={val} onChange={(v) => handleRowChange(record.key, 'quantity', v)} style={{ width: '100%' }} />
      )
    },
    {
      title: 'Giá vốn / Đơn vị (VNĐ)',
      dataIndex: 'cost',
      render: (val, record) => (
        <InputNumber 
           min={0} value={val} 
           formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
           onChange={(v) => handleRowChange(record.key, 'cost', v)} 
           style={{ width: '100%' }} 
        />
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      render: (val) => <span className="font-bold text-navy-700">{val.toLocaleString()} đ</span>
    },
    {
      title: '',
      render: (_, record) => <Button icon={<DeleteOutlined />} danger type="text" onClick={() => handleRemoveProduct(record.key)} />
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/inventory')} shape="circle" />
            <h2 className="text-2xl font-bold text-navy-700 m-0">Tạo Phiếu Nhập Hàng</h2>
         </div>
         <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} className="bg-brand-500 h-[40px] px-6 rounded-xl border-none font-bold">
            Hoàn tất nhập kho
         </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* CỘT TRÁI: THÔNG TIN CHUNG */}
           <div className="lg:col-span-1">
              <Card className="rounded-[20px] shadow-sm border-none mb-6">
                 <h4 className="font-bold text-navy-700 mb-4">Thông tin phiếu</h4>
                 <Form.Item name="supplier" label="Nhà cung cấp" rules={[{ required: true }]}>
                    <Select placeholder="Chọn NCC" className="h-[40px] rounded-xl custom-select-metrix">
                       <Option value="Hasfarm">Vườn Hoa Đà Lạt Hasfarm</Option>
                       <Option value="Holland">Hoa Nhập Khẩu Hà Lan</Option>
                    </Select>
                 </Form.Item>
                 <Form.Item name="importDate" label="Ngày nhập kho" rules={[{ required: true }]}>
                    <DatePicker className="w-full h-[40px] rounded-xl bg-[#F4F7FE] border-none" />
                 </Form.Item>
                 <Form.Item name="note" label="Ghi chú">
                    <TextArea rows={4} className="rounded-xl" placeholder="VD: Lô hàng hoa tươi phục vụ 14/2..." />
                 </Form.Item>
              </Card>

              <Card className="rounded-[20px] shadow-sm border-none bg-blue-50">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 font-medium">Tổng số lượng:</span>
                    <span className="font-bold text-navy-700">{products.reduce((acc, item) => acc + item.quantity, 0)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                    <span className="text-lg font-bold text-navy-700">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-brand-500">{totalAmount.toLocaleString()} đ</span>
                 </div>
              </Card>
           </div>

           {/* CỘT PHẢI: DANH SÁCH HÀNG HÓA */}
           <div className="lg:col-span-2">
              <Card className="rounded-[20px] shadow-sm border-none min-h-[500px]">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-navy-700">Chi tiết hàng nhập</h4>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddProduct}>Thêm dòng</Button>
                 </div>
                 
                 <Table 
                    columns={columns} 
                    dataSource={products} 
                    pagination={false} 
                    className="custom-table-metrix"
                    locale={{ emptyText: 'Chưa có sản phẩm nào. Bấm "Thêm dòng" để nhập.' }}
                 />
              </Card>
           </div>
        </div>
      </Form>
    </div>
  );
};

export default CreateImport;