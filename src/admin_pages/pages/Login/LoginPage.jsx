import React from 'react';
import { Form, Input, Checkbox, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();

    const onFinish = (values) => {
        console.log('Success:', values);
        // Giả lập đăng nhập thành công
        if (values.email === 'admin' && values.password === '123') {
            message.success('Đăng nhập thành công!');
            navigate('/admin/dashboard');
        } else {
            message.error('Sai tài khoản hoặc mật khẩu (Thử admin/123)');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-light-primary px-4">
            {/* Card Container */}
            <div className="max-w-[450px] w-full bg-white rounded-[20px] shadow-sm p-8 md:p-10">

                {/* Header: Logo & Title */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-navy-700 mb-2">Đăng Nhập</h1>
                    <p className="text-gray-400 text-sm">
                        Nhập email và mật khẩu để truy cập trang quản trị
                    </p>
                </div>

                {/* Form */}
                <Form
                    name="login"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                    className="flex flex-col gap-2"
                >
                    {/* Email Field */}
                    <Form.Item
                        label={<span className="text-navy-700 font-medium ml-1">Email*</span>}
                        name="email"
                        rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}
                    >
                        <Input
                            placeholder="mail@simmmple.com"
                            className="rounded-2xl border-gray-200 bg-white py-3 px-4 text-navy-700 placeholder:text-gray-400 focus:border-brand-500 hover:border-brand-400"
                        />
                    </Form.Item>

                    {/* Password Field */}
                    <Form.Item
                        label={<span className="text-navy-700 font-medium ml-1">Mật khẩu*</span>}
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            placeholder="Nhập mật khẩu"
                            className="rounded-2xl border-gray-200 bg-white py-3 px-4 text-navy-700 placeholder:text-gray-400 focus:border-brand-500 hover:border-brand-400"
                        />
                    </Form.Item>

                    {/* Checkbox & Forgot Password */}
                    <div className="flex justify-between items-center mb-6">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="text-navy-700 font-medium">Ghi nhớ tôi</Checkbox>
                        </Form.Item>

                        <a href="#" className="text-brand-500 font-bold hover:text-brand-600 text-sm">
                            Quên mật khẩu?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <Form.Item className="mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full h-[50px] rounded-2xl bg-brand-500 hover:!bg-brand-600 border-none font-bold text-base shadow-lg shadow-brand-500/40"
                        >
                            Đăng Nhập
                        </Button>
                    </Form.Item>
                </Form>

                {/* Footer Text */}
                <div className="mt-6 text-center">
                    <span className="text-gray-500 text-sm">Chưa có tài khoản? </span>
                    <a href="#" className="text-brand-500 font-bold hover:text-brand-600 text-sm">
                        Tạo tài khoản
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;