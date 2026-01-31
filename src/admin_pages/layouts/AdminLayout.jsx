import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Dropdown, Button, Breadcrumb } from 'antd';
import {
    MenuUnfoldOutlined, MenuFoldOutlined, SearchOutlined, BellOutlined, InfoCircleOutlined,
    UserOutlined, DashboardOutlined, ShoppingCartOutlined, FileTextOutlined,
    TeamOutlined, TagsOutlined, GiftOutlined, SettingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarcodeOutlined } from '@ant-design/icons';
import { MessageOutlined, CommentOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // --- MENU CHÍNH ---
    const mainMenuItems = [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/admin/orders', icon: <ShoppingCartOutlined />, label: 'Quản lý Đơn hàng' },
        { key: '/admin/products', icon: <FileTextOutlined />, label: 'Quản lý Sản phẩm' },
        { key: '/admin/customers', icon: <TeamOutlined />, label: 'Quản lý Khách hàng' },
        { key: '/admin/categories', icon: <TagsOutlined />, label: 'Quản lý Danh mục' },
        { key: '/admin/minigames', icon: <GiftOutlined />, label: 'Quản lý Minigame' },
        { key: '/admin/vouchers', icon: <BarcodeOutlined />, label: 'Quản lý Mã giảm giá' },
        { key: '/admin/reviews', icon: <CommentOutlined />, label: 'Quản lý Đánh giá' },
        { key: '/admin/chat', icon: <MessageOutlined />, label: 'Hỗ trợ khách hàng' },
    ];

    // --- MENU PHỤ ---
    const bottomMenuItems = [
        { key: '/admin/settings', icon: <SettingOutlined />, label: 'Cài đặt hệ thống' }, 
    ];

    // Logic Active Menu
    const currentPath = location.pathname;
    // Gộp cả 2 menu để tìm label cho Breadcrumb
    const allItems = [...mainMenuItems, ...bottomMenuItems];
    const currentItem = allItems.find(item => currentPath.startsWith(item.key));
    const currentBreadcrumb = currentItem ? currentItem.label : 'Trang chủ';
    const activeKey = currentItem ? currentItem.key : '';

    return (
        <Layout className="min-h-screen bg-[#F4F7FE]">

            {/* SIDEBAR */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                collapsedWidth={80}
                className="border-r border-gray-100 bg-white"
                style={{
                    position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, zIndex: 100,
                }}
            >
                {/* Container Flexbox để đẩy Menu đáy xuống dưới */}
                <div className="flex flex-col h-full">

                    {/* Logo */}
                    <div className="h-24 flex items-center justify-center flex-shrink-0">
                        <h1 className={`font-bold text-navy-700 transition-all duration-300 ${collapsed ? 'text-sm' : 'text-2xl'}`}>
                            {collapsed ? 'FLW' : 'FLOWER SHOP'}
                        </h1>
                    </div>

                    {/* Menu Chính */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <Menu
                            mode="inline"
                            selectedKeys={[activeKey]}
                            items={mainMenuItems}
                            onClick={({ key }) => navigate(key)}
                            className="border-none px-2 text-base font-medium text-gray-500"
                        />
                    </div>

                    {/* Menu Đáy */}
                    <div className="flex-shrink-0 pb-4">
                        {/* Đường kẻ phân cách nhỏ */}
                        <div className="mx-4 my-2 border-t-2 border-gray-300"></div>
                        <Menu
                            mode="inline"
                            selectedKeys={[activeKey]}
                            items={bottomMenuItems}
                            onClick={({ key }) => navigate(key)}
                            className="border-none px-2 text-base font-medium text-gray-500"
                        />
                    </div>

                </div>
            </Sider>

            {/* CONTENT AREA */}
            <Layout
                className="bg-[#F4F7FE] transition-all duration-200 ease-in-out"
                style={{ marginLeft: collapsed ? 80 : 260 }}
            >
                <Header className="bg-[#F4F7FE] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center h-auto md:h-24 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
                    <div className="flex flex-col gap-1">
                        <Breadcrumb>
                            <Breadcrumb.Item>Pages</Breadcrumb.Item>
                            <Breadcrumb.Item>{currentBreadcrumb}</Breadcrumb.Item>
                        </Breadcrumb>
                        <h2 className="text-3xl font-bold text-navy-700 m-0">{currentBreadcrumb}</h2>
                    </div>

                    <div className="mt-4 md:mt-0 p-3 bg-white rounded-full shadow-sm flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Search..." bordered={false} className="bg-[#F4F7FE] rounded-full w-[200px] text-sm" />
                        <div className="flex items-center gap-3 text-gray-400">
                            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hidden md:flex" />
                            <BellOutlined className="text-xl hover:text-brand-500 cursor-pointer" />
                            <InfoCircleOutlined className="text-xl hover:text-brand-500 cursor-pointer" />
                            <Dropdown overlay={<Menu items={[{ key: '1', label: 'Cài đặt', onClick: () => navigate('/admin/settings') }, { key: '2', label: 'Đăng xuất', danger: true, onClick: () => navigate('/admin/login') }]} />} placement="bottomRight">
                                <Avatar size="large" className="bg-brand-500 cursor-pointer transform hover:scale-105 transition-transform" icon={<UserOutlined />} />
                            </Dropdown>
                        </div>
                    </div>
                </Header>

                <Content className="m-4 md:m-6 mt-0 min-h-[280px]">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;