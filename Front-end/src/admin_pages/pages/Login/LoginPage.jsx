import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gọi API đăng nhập
      const response = await authService.login(values.email, values.password);

      // Kiểm tra kết quả (Back-end trả về success: true)
      if (response.success) {
        message.success('Đăng nhập thành công!');
        
        // Lưu thông tin User + Token vào LocalStorage
        // Dữ liệu này sẽ được dùng ở AdminLayout và axiosClient
        localStorage.setItem('user', JSON.stringify(response.data));

        // Chuyển hướng vào trang Dashboard
        navigate('/admin/dashboard');
      } else {
        message.error(response.message || 'Đăng nhập thất bại!');
      }
    } catch (error) {
      // Xử lý lỗi từ server (sai pass, lỗi mạng)
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-100 to-purple-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-700">Flower Shop</h1>
          <p className="text-gray-400 mt-2">Đăng nhập quản trị viên</p>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ tôi</Checkbox>
            </Form.Item>
            <a className="float-right text-brand-500 hover:text-brand-600" href="">Quên mật khẩu?</a>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full bg-brand-500 font-bold h-12 rounded-xl"
              loading={loading} // Hiệu ứng quay khi đang gọi API
            >
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;