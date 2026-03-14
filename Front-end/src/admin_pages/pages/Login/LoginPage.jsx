import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Gọi API đăng nhập thật
            const response = await authService.login(values.email, values.password);
            console.log('[Login] Raw response:', response);

            // Backend trả về { success: true, data: { token, name, role, ... } }
            if (response && response.data) {
                console.log('[Login] Data to save:', response.data);
                // Lưu toàn bộ data (bao gồm token, name, role) vào localStorage
                authService.saveUser(response.data);
                message.success('Đăng nhập thành công!');
                navigate('/admin/dashboard');
            } else {
                message.error('Phản hồi từ server không hợp lệ!');
            }
        }
        catch (error) {
            const errMsg = error?.response?.data?.message || 'Sai tài khoản hoặc mật khẩu!';
            message.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#2B3674] mb-2">FLOWER SHOP</h1>
                    <p className="text-gray-500">Đăng nhập hệ thống quản trị</p>
                </div>

                <Form
                    name="admin_login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập Email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input 
                            prefix={<UserOutlined className="text-gray-400" />} 
                            placeholder="Email quản trị viên" 
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Mật khẩu"
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <div className="flex justify-between items-center mb-6">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="text-gray-500">Ghi nhớ tôi</Checkbox>
                        </Form.Item>
                        <a className="text-blue-600 hover:text-blue-800 font-medium text-sm" href="#">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-medium text-base shadow-md shadow-blue-500/30"
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default LoginPage;