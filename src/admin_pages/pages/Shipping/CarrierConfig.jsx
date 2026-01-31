import React, { useState } from 'react';
import { Card, Switch, Button, Modal, Form, Input, Tag, message } from 'antd';
import { SettingOutlined, ApiOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

const CarrierConfig = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCarrier, setCurrentCarrier] = useState(null);
  const [form] = Form.useForm();

  // Dữ liệu giả lập các đối tác
  const [carriers, setCarriers] = useState([
    { 
      id: 1, name: 'Giao Hàng Nhanh (GHN)', code: 'GHN', status: true, 
      logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-GHN-Slogan-En.png' 
    },
    { 
      id: 2, name: 'Giao Hàng Tiết Kiệm (GHTK)', code: 'GHTK', status: false, 
      logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-GHTK-Green.png' 
    },
    { 
      id: 3, name: 'Ahamove (Siêu tốc)', code: 'AHAMOVE', status: true, 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Ahamove_Logo.png' 
    },
  ]);

  const handleOpenConfig = (carrier) => {
    setCurrentCarrier(carrier);
    form.setFieldsValue({
      token: '****************', // Giả lập token đã lưu
      shopId: '123456'
    });
    setIsModalOpen(true);
  };

  const handleSaveConfig = () => {
    message.success(`Đã cập nhật cấu hình ${currentCarrier.name}`);
    setIsModalOpen(false);
  };

  const toggleStatus = (id) => {
    const updated = carriers.map(c => c.id === id ? { ...c, status: !c.status } : c);
    setCarriers(updated);
    message.success('Đã thay đổi trạng thái hoạt động');
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-700">Đối Tác Vận Chuyển</h2>
        <p className="text-gray-500 text-sm">Kết nối API để tự động tính phí và đẩy đơn hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carriers.map(carrier => (
          <Card key={carrier.id} className="rounded-[20px] shadow-sm border-none hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-4">
                <img src={carrier.logo} alt={carrier.name} className="h-10 object-contain" />
                <Switch 
                  checked={carrier.status} 
                  onChange={() => toggleStatus(carrier.id)} 
                  checkedChildren={<CheckCircleOutlined />} 
                  unCheckedChildren={<StopOutlined />} 
                />
             </div>
             
             <h4 className="font-bold text-navy-700 text-lg mb-2">{carrier.name}</h4>
             
             <div className="flex items-center gap-2 mb-6">
                <Tag color={carrier.status ? 'green' : 'default'}>
                   {carrier.status ? 'Đang kết nối' : 'Ngắt kết nối'}
                </Tag>
                <Tag color="blue">API v2.0</Tag>
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
        okText="Lưu Kết Nối"
        cancelText="Hủy"
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
           <div className="bg-blue-50 p-3 rounded-xl mb-4 text-blue-600 text-xs">
              <ApiOutlined className="mr-1" /> Vui lòng nhập API Token được cung cấp bởi trang quản trị của đơn vị vận chuyển.
           </div>
           
           <Form.Item name="shopId" label="Shop ID / Client ID" rules={[{ required: true }]}>
              <Input className="rounded-xl h-[40px]" />
           </Form.Item>

           <Form.Item name="token" label="API Token (Private Key)" rules={[{ required: true }]}>
              <Input.Password className="rounded-xl h-[40px]" />
           </Form.Item>

           <Form.Item name="sandbox" label="Chế độ thử nghiệm (Sandbox)" valuePropName="checked">
              <Switch />
           </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CarrierConfig;