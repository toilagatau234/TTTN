import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Badge, Dropdown, Button, Breadcrumb } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    SearchOutlined,
    BellOutlined,
    InfoCircleOutlined,
    UserOutlined,
    DashboardOutlined,
    ShoppingCartOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Danh sách menu Sidebar
    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/admin/orders',
            icon: <ShoppingCartOutlined />,
            label: 'Quản lý Đơn hàng',
        },
        {
            key: '/admin/products', // Sẽ làm sau
            icon: <FileTextOutlined />,
            label: 'Sản phẩm (Demo)',
        },
    ];

    // Lấy tên trang hiện tại để hiển thị Breadcrumb
    const currentPath = location.pathname;
    const currentBreadcrumb = menuItems.find(item => item.key === currentPath)?.label || 'Trang chủ';

    return (
        <Layout className="min-h-screen bg-[#F4F7FE]">
            {/* --- SIDEBAR --- */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                className="bg-white !important border-r border-gray-100"
                style={{ backgroundColor: 'white' }} // Force nền trắng
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-center border-b border-gray-50 mb-4">
                    <h1 className={`font-bold text-navy-700 transition-all duration-300 ${collapsed ? 'text-sm' : 'text-2xl'}`}>
                        {collapsed ? 'FLW' : 'FLOWER SHOP'}
                    </h1>
                </div>

                {/* Menu */}
                <Menu
                    mode="inline"
                    defaultSelectedKeys={['/admin/dashboard']}
                    selectedKeys={[currentPath]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    className="border-none px-2"
                    itemIcon={null}
                    style={{ backgroundColor: 'transparent' }}
                    // Tùy chỉnh CSS cho Menu Item active giống Metrix (Vạch xanh bên phải + Chữ đậm)
                    theme="light"
                />
            </Sider>

            {/* --- MAIN CONTENT AREA --- */}
            <Layout className="bg-[#F4F7FE]">

                {/* --- HEADER --- */}
                <Header className="bg-[#F4F7FE] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center h-auto md:h-24">

                    {/* Left: Breadcrumb & Title */}
                    <div className="flex flex-col gap-1">
                        <Breadcrumb className="text-sm text-gray-500">
                            <Breadcrumb.Item>Pages</Breadcrumb.Item>
                            <Breadcrumb.Item>{currentBreadcrumb}</Breadcrumb.Item>
                        </Breadcrumb>
                        <h2 className="text-2xl font-bold text-navy-700 m-0">{currentBreadcrumb}</h2>
                    </div>

                    {/* Right: Search & Profile & Toggle Sidebar */}
                    <div className="mt-4 md:mt-0 p-3 bg-white rounded-full shadow-sm flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">

                        {/* Search Input (Bo tròn) */}
                        <Input
                            prefix={<SearchOutlined className="text-gray-400" />}
                            placeholder="Search..."
                            bordered={false}
                            className="bg-[#F4F7FE] rounded-full w-[200px] text-sm"
                        />

                        <div className="flex items-center gap-3 text-gray-400">
                            {/* Nút đóng mở Sidebar (Mobile view) */}
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                className="text-gray-500 hidden md:flex"
                            />

                            <BellOutlined className="text-xl hover:text-brand-500 cursor-pointer transition-colors" />
                            <InfoCircleOutlined className="text-xl hover:text-brand-500 cursor-pointer transition-colors" />

                            {/* Avatar Profile */}
                            <Dropdown menu={{ items: [{ key: '1', label: 'Đăng xuất', danger: true, onClick: () => navigate('/admin/login') }] }}>
                                <Avatar
                                    size="large"
                                    className="bg-brand-500 cursor-pointer transform hover:scale-105 transition-transform"
                                    icon={<UserOutlined />}
                                />
                            </Dropdown>
                        </div>
                    </div>
                </Header>

                {/* --- CONTENT PAGE --- */}
                <Content className="m-4 md:m-6 mt-0 min-h-[280px]">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;