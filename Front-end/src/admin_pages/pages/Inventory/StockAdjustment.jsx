import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, Table, InputNumber, message, Tag, Radio } from 'antd';
import { DeleteOutlined, SaveOutlined, WarningOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';
import productService from '../../../services/productService';

const { Option } = Select;
const { TextArea } = Input;

const StockAdjustment = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const adjustType = Form.useWatch('type', form) || 'out';
  const [items, setItems] = useState([]);

  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    productService.getAll({ limit: 100 })
      .then(res => {
        if (res.success) setDbProducts(res.data);
      })
      .catch(err => console.error("Lỗi tải sản phẩm:", err));
  }, []);

  const handleAddItem = () => {
    setItems([...items, { key: Date.now(), productId: null, currentStock: 0, adjustQty: 1, reason: adjustType === 'in' ? 'Inventory Surplus' : 'Damaged' }]);
  };

  const handleRemoveItem = (key) => {
    setItems(items.filter(i => i.key !== key));
  };

  const handleRowChange = (key, field, value) => {
    const newItems = items.map(item => {
      if (item.key === key) {
        let updates = { [field]: value };
        // Nếu chọn sản phẩm, tự động điền tồn kho hiện tại
        if (field === 'productId') {
          const prod = dbProducts.find(p => p._id === value);
          updates.currentStock = prod ? prod.stock : 0;
        }
        return { ...item, ...updates };
      }
      return item;
    });
    setItems(newItems);
  };

  const onFinish = async (values) => {
    if (items.length === 0) return message.error('Chọn ít nhất 1 sản phẩm để xử lý!');
    
    let hasError = false;
    for (const item of items) {
      if (!item.productId) {
        message.error('Vui lòng chọn sản phẩm trên tất cả các dòng báo huỷ');
        return;
      }
      if (item.adjustQty <= 0) {
        message.error('Số lượng báo huỷ phải lớn hơn 0');
        return;
      }
      const currentType = form.getFieldValue('type');
      if (currentType === 'out' && item.adjustQty > item.currentStock) {
        message.error(`Số lượng báo huỷ không thể vượt quá ${item.currentStock}`);
        return;
      }
    }

    try {
      // Gửi toàn bộ danh sách lên Backend trong 1 request
      const payload = {
        type: form.getFieldValue('type'),
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.adjustQty,
          reason: item.reason
        })),
        notes: values.note
      };

      const res = await inventoryService.createAdjustment(payload);
      
      if (res.success) {
        message.success(`Đã cập nhật tồn kho thành công cho ${items.length} mặt hàng!`);
        setTimeout(() => navigate('/admin/inventory'), 1000);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi gọi API báo huỷ');
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productId',
      width: '30%',
      render: (val, record) => (
        <Select 
          placeholder="Chọn sản phẩm" 
          value={val}
          style={{ width: '100%' }}
          onChange={(v) => handleRowChange(record.key, 'productId', v)}
          showSearch
          filterOption={(input, option) =>
            (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {dbProducts.map(p => <Option key={p._id} value={p._id}>{p.name} (Kho: {p.stock})</Option>)}
        </Select>
      )
    },
    {
      title: 'Tồn hiện tại',
      dataIndex: 'currentStock',
      render: (val) => <Tag color="blue">{val}</Tag>
    },
    {
      title: 'Số lượng điều chỉnh',
      dataIndex: 'adjustQty',
      render: (val, record) => (
        <InputNumber 
          min={1} 
          // Chỉ chặn tối đa nếu là xuất huỷ
          max={adjustType === 'out' ? record.currentStock : undefined} 
          value={val} 
          onChange={(v) => handleRowChange(record.key, 'adjustQty', v)}
          className="w-full"
        />
      )
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      render: (val, record) => (
        <Select value={val} onChange={(v) => handleRowChange(record.key, 'reason', v)} style={{ width: 150 }}>
           {adjustType === 'in' ? (
             <>
               <Option value="Inventory Surplus">Kiểm kê dư</Option>
               <Option value="Gift/Promo">Hàng tặng / Khuyến mãi</Option>
               <Option value="Returned">Khách đổi trả (nhập lại)</Option>
               <Option value="Other">Khác</Option>
             </>
           ) : (
             <>
               <Option value="Damaged">Hư hỏng / Héo</Option>
               <Option value="Expired">Hết hạn</Option>
               <Option value="Lost">Thất lạc / Mất</Option>
               <Option value="Internal">Dùng nội bộ</Option>
             </>
           )}
        </Select>
      )
    },
    {
      render: (_, record) => <Button icon={<DeleteOutlined />} danger type="text" onClick={() => handleRemoveItem(record.key)} />
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/inventory')} shape="circle" />
            <h2 className="text-2xl font-bold text-navy-700 m-0">Kiểm Kê / Báo Hủy</h2>
         </div>
         <Button type="primary" danger icon={<WarningOutlined />} onClick={() => form.submit()} className="h-[40px] px-6 rounded-xl font-bold border-none">
            Xác nhận
         </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'out' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Cột trái */}
           <div className="lg:col-span-1">
              <Card className="rounded-[20px] shadow-sm border-none">
                 <Form.Item name="type" label="Loại điều chỉnh">
                    <Radio.Group buttonStyle="solid" className="w-full flex">
                       <Radio.Button value="out" className="flex-1 text-center">Xuất Hủy (Giảm)</Radio.Button>
                       <Radio.Button value="in" className="flex-1 text-center">Kiểm Kê (Tăng)</Radio.Button>
                    </Radio.Group>
                 </Form.Item>
                 <div className={`p-4 rounded-xl mb-4 text-sm ${adjustType === 'in' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                    <WarningOutlined className="mr-2" />
                    Lưu ý: Hành động này sẽ <strong>{adjustType === 'in' ? 'cộng trực tiếp' : 'trừ trực tiếp'}</strong> vào số lượng tồn kho của sản phẩm. Không thể hoàn tác.
                 </div>
                 <Form.Item name="note" label="Ghi chú">
                    <TextArea rows={4} className="rounded-xl" placeholder="VD: Hoa héo do để qua đêm không bảo quản lạnh..." />
                 </Form.Item>
              </Card>
           </div>

           {/* Cột phải */}
           <div className="lg:col-span-2">
              <Card className="rounded-[20px] shadow-sm border-none min-h-[400px]">
                 <div className="flex justify-between mb-4">
                    <h4 className="font-bold text-navy-700">Danh sách sản phẩm</h4>
                    <Button type="dashed" onClick={handleAddItem}>+ Chọn sản phẩm</Button>
                 </div>
                 <Table columns={columns} dataSource={items} pagination={false} className="custom-table-metrix" locale={{ emptyText: 'Chưa có sản phẩm nào' }} />
              </Card>
           </div>
        </div>
      </Form>
    </div>
  );
};

export default StockAdjustment;