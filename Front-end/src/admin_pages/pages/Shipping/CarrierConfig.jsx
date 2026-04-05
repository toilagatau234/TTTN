import React, { useState, useEffect } from 'react';
import { Card, Switch, Button, Modal, Form, Input, Tag, message } from 'antd';
import { SettingOutlined, ApiOutlined, CheckCircleOutlined, StopOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import shippingService from '../../../services/shippingService';

const CarrierConfig = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCarrier, setCurrentCarrier] = useState(null);
  const [carriers, setCarriers] = useState([]);
  const [form] = Form.useForm();

  const fetchCarriers = async () => {
    try {
      const res = await shippingService.getCarriers();
      if (res.success) {
        setCarriers(res.data);
      }
    } catch (err) {
      message.error('Không thể tải cấu hình Vận chuyển');
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const handleOpenConfig = (carrier) => {
    setCurrentCarrier(carrier);
    form.setFieldsValue({
      token: carrier.apiToken || '',
      shopId: carrier.shopId || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields();
      const res = await shippingService.updateCarrierConfig(currentCarrier._id, {
        apiToken: values.token,
        shopId: values.shopId
      });
      if (res.success) {
        message.success(`Đã cập nhật cấu hình API của ${currentCarrier.name}`);
        setIsModalOpen(false);
        fetchCarriers();
      }
    } catch (err) {
      if (err.name === 'ValidationError') return;
      message.error('Lỗi khi cập nhật cấu hình API');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await shippingService.updateCarrierConfig(id, { isActive: !currentStatus });
      if (res.success) {
        message.success('Đã thay đổi trạng thái hoạt động đối tác giao hàng');
        fetchCarriers();
      }
    } catch (error) {
      message.error('Thất bại khi đổi trạng thái');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center gap-4">
        <Button 
           icon={<LeftOutlined />} 
           onClick={() => navigate('/admin/shipping')} 
           className="border-none bg-gray-100 hover:bg-gray-200 rounded-xl"
        />
        <div>
           <h2 className="text-2xl font-bold text-navy-700 m-0">Đối Tác Vận Chuyển</h2>
           <p className="text-gray-500 text-sm m-0 mt-1">Kết nối API để tự động tính phí và đẩy đơn hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carriers.map(carrier => (
          <Card key={carrier._id} className="rounded-[20px] shadow-sm border-none hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-4">
                <img src={carrier.logo || 'https://placehold.co/100x40?text='+carrier.code} alt={carrier.name} className="h-10 object-contain" />
                <Switch 
                  checked={carrier.isActive} 
                  onChange={() => toggleStatus(carrier._id, carrier.isActive)} 
                  checkedChildren={<CheckCircleOutlined />} 
                  unCheckedChildren={<StopOutlined />} 
                />
             </div>
             
             <h4 className="font-bold text-navy-700 text-lg mb-2">{carrier.name}</h4>
             
             <div className="flex items-center gap-2 mb-6">
                <Tag color={carrier.isActive ? 'green' : 'default'}>
                   {carrier.isActive ? 'Đang kết nối' : 'Đã ngắt kết nối'}
                </Tag>
                {carrier.apiToken ? (
                  <Tag color="blue">Đã khai báo API Key</Tag>
                ) : (
                  <Tag color="red">Chưa cấu hình API Key</Tag>
                )}
             </div>

             <Button 
               type="dashed" 
               icon={<SettingOutlined />} 
               block 
               onClick={() => handleOpenConfig(carrier)}
               className="rounded-xl h-[40px] border-brand-500 text-brand-500 hover:bg-brand-50"
             >
               Cấu hình API
             </Button>
          </Card>
        ))}
      </div>

      {/* Modal Cấu hình API Key */}
      <Modal
        title={currentCarrier ? `Cấu hình kết nối - ${currentCarrier.name}` : 'Cấu hình'}
        open={isModalOpen}
        onOk={handleSaveConfig}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu Mật khẩu & Kết Nối"
        cancelText="Hủy"
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
           <div className="bg-blue-50 p-3 rounded-xl mb-4 text-blue-600 text-xs">
              <ApiOutlined className="mr-1" /> Vui lòng nhập API Token được cung cấp bởi trang quản trị của đơn vị vận chuyển (GHN). Các API Token cũ ở .env đã bị vô hiệu hóa vì lý do bảo mật.
           </div>
           
           <Form.Item name="shopId" label="Shop ID / Client ID" rules={[{ required: true, message: 'Nhập Shop ID' }]}>
              <Input className="rounded-xl h-[40px]" />
           </Form.Item>

           <Form.Item name="token" label="API Token (Private Key)" rules={[{ required: true, message: 'Nhập API Token' }]}>
              <Input.Password className="rounded-xl h-[40px]" placeholder="VD: 5f9b..." />
           </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CarrierConfig;