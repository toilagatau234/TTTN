import React from 'react';
import { Form, Input, Checkbox, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();

    const onFinish = (values) => {
        if (values.email === 'admin' && values.password === '123') {
            message.success('Xin chào Admin!');
            navigate('/admin/dashboard');
        } else {
            message.error('Tài khoản không có quyền truy cập hoặc sai mật khẩu!');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FE] px-4 font-sans">
            {/* Card Container */}
            <div className="max-w-[420px] w-full bg-white rounded-[30px] shadow-sm p-8 md:p-12">

                {/* Header */}
                <div className="mb-10 text-left">
                    <h1 className="text-4xl font-bold text-navy-700 mb-2 tracking-tight">Admin Login</h1>
                    <p className="text-gray-400 text-sm font-medium">
                        Nhập email và mật khẩu để truy cập hệ thống quản trị.
                    </p>
                </div>

                {/* Form */}
                <Form
                    name="login"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                    className="flex flex-col"
                >
                    {/* Email Field */}
                    <Form.Item
                        label={<span className="text-navy-700 font-bold text-sm ml-1 mb-2 block">Email*</span>}
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập Email!' },
                            { type: 'email', message: 'Email không hợp lệ!' } // kiểm tra validate email chặt chẽ
                        ]}
                        className="mb-6"
                    >
                        <Input
                            placeholder="admin@flower.shop"
                            className="h-[50px] rounded-2xl border-none bg-[#F4F7FE] px-5 text-navy-700 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-500 hover:bg-[#F4F7FE]"
                        />
                    </Form.Item>

                    {/* Password Field */}
                    <Form.Item
                        label={<span className="text-navy-700 font-bold text-sm ml-1 mb-2 block">Password*</span>}
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        className="mb-6"
                    >
                        <Input.Password
                            placeholder="Nhập mật khẩu quản trị"
                            className="h-[50px] rounded-2xl border-none bg-[#F4F7FE] px-5 text-navy-700 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-500 hover:bg-[#F4F7FE]"
                        />
                    </Form.Item>

                    {/* Checkbox & Forgot Password */}
                    <div className="flex justify-between items-center mb-8">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="text-navy-700 font-medium custom-checkbox">Ghi nhớ tôi</Checkbox>
                        </Form.Item>

                    </div>

                    {/* Submit Button */}
                    <Form.Item className="mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full h-[54px] rounded-2xl bg-brand-500 hover:!bg-brand-600 border-none font-bold text-base shadow-xl shadow-brand-500/20"
                        >
                            Đăng Nhập
                        </Button>
                    </Form.Item>
                </Form>

            </div>
        </div>
    );
};

export default LoginPage;