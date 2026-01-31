// src/admin_pages/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Dropdown, Button, Breadcrumb } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    SearchOutlined,
    BellOutlined,
    InfoCircleOutlined,
    UserOutlined,
    DashboardOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    TeamOutlined,
    TagsOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { GiftOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // --- CẤU HÌNH MENU SIDEBAR ---
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
            key: '/admin/products',
            icon: <FileTextOutlined />,
            label: 'Quản lý Sản phẩm',
        },
        {
            key: '/admin/customers',
            icon: <TeamOutlined />,
            label: 'Quản lý Khách hàng',
        },
        {
            key: '/admin/categories',
            icon: <TagsOutlined />,
            label: 'Quản lý Danh mục',
        },
        {
            key: '/admin/minigame',
            icon: <GiftOutlined />,
            label: 'Quản lý Minigame',
        },
    ];

    // Logic xác định menu đang active dựa trên đường dẫn hiện tại
    const currentPath = location.pathname;
    // Tìm item có key trùng hoặc là cha của path hiện tại (VD: /admin/products/create vẫn active /admin/products)
    const currentItem = menuItems.find(item => currentPath.startsWith(item.key));
    const currentBreadcrumb = currentItem ? currentItem.label : 'Trang chủ';
    const activeKey = currentItem ? currentItem.key : '';

    return (
        <Layout className="min-h-screen bg-[#F4F7FE]">
            {/* --- SIDEBAR CỐ ĐỊNH (FIXED) --- */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                collapsedWidth={80} // Chiều rộng khi thu nhỏ
                className="border-r border-gray-100"
                style={{
                    overflow: 'auto',
                    height: '100vh',     // Chiều cao full màn hình
                    position: 'fixed',   // Cố định vị trí
                    left: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: 'white',
                    zIndex: 100          // Nằm trên các thành phần khác
                }}
            >
                {/* Logo */}
                <div className="h-24 flex items-center justify-center mb-2">
                    <h1 className={`font-bold text-navy-700 transition-all duration-300 ${collapsed ? 'text-sm' : 'text-2xl'}`}>
                        {collapsed ? 'FLW' : 'FLOWER SHOP'}
                    </h1>
                </div>

                {/* Menu */}
                <Menu
                    mode="inline"
                    defaultSelectedKeys={['/admin/dashboard']}
                    selectedKeys={[activeKey]} // Active đúng menu item
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    className="border-none px-4 text-base font-medium text-gray-500"
                    style={{ backgroundColor: 'transparent' }}
                />
            </Sider>

            {/* --- PHẦN NỘI DUNG CHÍNH (ĐẨY QUA PHẢI) --- */}
            <Layout
                className="bg-[#F4F7FE] transition-all duration-200 ease-in-out"
                // Quan trọng: Margin left thay đổi theo trạng thái Sidebar
                style={{ marginLeft: collapsed ? 80 : 260 }}
            >

                {/* --- HEADER --- */}
                {/* Thêm sticky top-0 nếu bạn muốn Header cũng trôi theo khi cuộn */}
                <Header className="bg-[#F4F7FE] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center h-auto md:h-24 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">

                    {/* Left: Breadcrumb & Title */}
                    <div className="flex flex-col gap-1">
                        <Breadcrumb className="text-sm text-gray-500">
                            <Breadcrumb.Item>Pages</Breadcrumb.Item>
                            <Breadcrumb.Item>{currentBreadcrumb}</Breadcrumb.Item>
                        </Breadcrumb>
                        <h2 className="text-3xl font-bold text-navy-700 m-0">{currentBreadcrumb}</h2>
                    </div>

                    {/* Right: Search & Profile & Toggle Sidebar */}
                    <div className="mt-4 md:mt-0 p-3 bg-white rounded-full shadow-sm flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">

                        {/* Search Input */}
                        <Input
                            prefix={<SearchOutlined className="text-gray-400" />}
                            placeholder="Search..."
                            bordered={false}
                            className="bg-[#F4F7FE] rounded-full w-[200px] text-sm"
                        />

                        <div className="flex items-center gap-3 text-gray-400">
                            {/* Nút đóng mở Sidebar */}
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                className="text-gray-500 hidden md:flex"
                            />

                            <BellOutlined className="text-xl hover:text-brand-500 cursor-pointer transition-colors" />
                            <InfoCircleOutlined className="text-xl hover:text-brand-500 cursor-pointer transition-colors" />

                            {/* Avatar Profile */}
                            <Dropdown
                                overlay={
                                    <Menu items={[{ key: '1', label: 'Đăng xuất', danger: true, onClick: () => navigate('/admin/login') }]} />
                                }
                                placement="bottomRight"
                            >
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