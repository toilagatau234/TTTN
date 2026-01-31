import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Upload, Switch, Row, Col, message, Avatar } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  BellOutlined, 
  UploadOutlined, 
  SaveOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;

// --- THÔNG TIN CÁ NHÂN ---
const ProfileSettings = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Cập nhật hồ sơ thành công!');
    }, 1000);
  };

  return (
    <Form layout="vertical" onFinish={onFinish} initialValues={{ 
        name: 'Admin User', 
        email: 'admin@flower.shop', 
        phone: '0901234567', 
        bio: 'Quản trị viên hệ thống Flower Shop' 
    }}>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
           <Avatar size={100} icon={<UserOutlined />} src="https://i.pravatar.cc/300" className="border-4 border-white shadow-lg" />
           <Upload showUploadList={false}>
              <Button icon={<UploadOutlined />} className="rounded-xl">Đổi ảnh đại diện</Button>
           </Upload>
        </div>

        {/* Form Section */}
        <div className="flex-1 w-full">
           <Row gutter={16}>
             <Col span={24} md={12}>
               <Form.Item label="Họ và tên" name="name" rules={[{ required: true }]}>
                 <Input prefix={<UserOutlined className="text-gray-400" />} className="rounded-xl h-[44px]" />
               </Form.Item>
             </Col>
             <Col span={24} md={12}>
               <Form.Item label="Số điện thoại" name="phone">
                 <Input prefix={<PhoneOutlined className="text-gray-400" />} className="rounded-xl h-[44px]" />
               </Form.Item>
             </Col>
             <Col span={24}>
               <Form.Item label="Email (Không thể thay đổi)" name="email">
                 <Input prefix={<MailOutlined className="text-gray-400" />} disabled className="rounded-xl h-[44px] bg-gray-50 text-gray-500" />
               </Form.Item>
             </Col>
             <Col span={24}>
               <Form.Item label="Giới thiệu ngắn" name="bio">
                 <Input.TextArea rows={4} className="rounded-xl" />
               </Form.Item>
             </Col>
           </Row>
           <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} className="bg-brand-500 h-10 px-6 rounded-xl font-bold border-none hover:bg-brand-600">
             Lưu Thay Đổi
           </Button>
        </div>
      </div>
    </Form>
  );
};

// --- ĐỔI MẬT KHẨU ---
const SecuritySettings = () => {
  return (
    <Form layout="vertical" className="max-w-[600px]">
       <Form.Item label="Mật khẩu hiện tại" name="currentPassword" rules={[{ required: true }]}>
         <Input.Password prefix={<LockOutlined />} className="rounded-xl h-[44px]" />
       </Form.Item>
       
       <Row gutter={16}>
         <Col span={12}>
           <Form.Item label="Mật khẩu mới" name="newPassword" rules={[{ required: true }]}>
             <Input.Password className="rounded-xl h-[44px]" />
           </Form.Item>
         </Col>
         <Col span={12}>
           <Form.Item label="Nhập lại mật khẩu mới" name="confirmPassword" rules={[{ required: true }]}>
             <Input.Password className="rounded-xl h-[44px]" />
           </Form.Item>
         </Col>
       </Row>

       <div className="bg-orange-50 p-4 rounded-xl mb-6">
         <h5 className="font-bold text-orange-600 mb-1">Yêu cầu mật khẩu</h5>
         <ul className="list-disc pl-5 text-sm text-gray-600">
           <li>Tối thiểu 8 ký tự</li>
           <li>Bao gồm ít nhất một ký tự đặc biệt</li>
         </ul>
       </div>

       <Button type="primary" className="bg-brand-500 h-10 px-6 rounded-xl font-bold border-none">
         Đổi Mật Khẩu
       </Button>
    </Form>
  );
};

// --- THÔNG BÁO ---
const NotificationSettings = () => {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div>
            <h5 className="font-bold text-navy-700">Thông báo đơn hàng mới</h5>
            <p className="text-gray-500 text-sm">Nhận email khi có khách đặt hàng</p>
          </div>
          <Switch defaultChecked />
       </div>
       <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div>
            <h5 className="font-bold text-navy-700">Thông báo tồn kho</h5>
            <p className="text-gray-500 text-sm">Cảnh báo khi sản phẩm sắp hết hàng</p>
          </div>
          <Switch defaultChecked />
       </div>
       <div className="flex justify-between items-center">
          <div>
            <h5 className="font-bold text-navy-700">Tin tức cập nhật hệ thống</h5>
            <p className="text-gray-500 text-sm">Nhận thông tin về các tính năng mới</p>
          </div>
          <Switch />
       </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="w-full">
      <div className="mb-6">
        
      </div>

      <div className="bg-white p-6 rounded-[20px] shadow-sm min-h-[500px]">
        <Tabs defaultActiveKey="1" tabPosition="left" className="custom-tabs-metrix">
          <TabPane tab={<span className="font-medium"><UserOutlined /> Hồ sơ của tôi</span>} key="1">
             <div className="pl-4"><ProfileSettings /></div>
          </TabPane>
          <TabPane tab={<span className="font-medium"><LockOutlined /> Bảo mật & Mật khẩu</span>} key="2">
             <div className="pl-4"><SecuritySettings /></div>
          </TabPane>
          <TabPane tab={<span className="font-medium"><BellOutlined /> Cấu hình thông báo</span>} key="3">
             <div className="pl-4"><NotificationSettings /></div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;