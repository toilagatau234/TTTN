import React from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();

    const onFinish = (values) => {
        // Demo logic đăng nhập đơn giản
        console.log('Thông tin đăng nhập: ', values);
        if (values.username === 'admin' && values.password === '123456') {
            message.success('Đăng nhập thành công!');
            // Chuyển hướng đến Dashboard sau khi đăng nhập thành công
            // navigate('/admin/dashboard'); 
        } else {
            message.error('Tài khoản hoặc mật khẩu không đúng!');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
                {/* Phần Logo và Tiêu đề */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        {/* Placeholder cho Logo */}
                        <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                            A
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Admin!</h2>
                    <p className="text-gray-500">Đăng nhập để quản lý hệ thống hoa tươi</p>
                </div>

                {/* Form Ant Design */}
                <Form
                    name="admin_login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-400" />}
                            placeholder="Tài khoản hoặc Email"
                            className="rounded-lg py-2"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Mật khẩu"
                            className="rounded-lg py-2"
                        />
                    </Form.Item>

                    <div className="flex justify-between items-center mb-6">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                        </Form.Item>
                        <a className="text-blue-600 hover:text-blue-800 font-medium" href="#">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 border-none h-12 text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300"
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