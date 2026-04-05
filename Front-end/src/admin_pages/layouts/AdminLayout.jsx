import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Dropdown, Button, Breadcrumb } from 'antd';
import {
    MenuUnfoldOutlined, MenuFoldOutlined, SearchOutlined, BellOutlined, InfoCircleOutlined,
    UserOutlined, DashboardOutlined, SettingOutlined, SafetyCertificateOutlined,
    DatabaseOutlined, CustomerServiceOutlined, ShoppingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

import { MENU_PERMISSIONS } from '../../constants/roles';

const { Header, Sider, Content } = Layout;

// Giả lập hàm lấy user (bọc try catch chống crash)
const getCurrentUser = () => {
    return authService.getCurrentUser() || { "name": "Admin", "role": "Admin" };
};

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const currentUser = getCurrentUser();

    // --- HÀM LỌC MENU THEO QUYỀN ---
    const checkPermission = (key) => {
        const allowedRoles = MENU_PERMISSIONS[key];
        if (!allowedRoles) return true;
        return allowedRoles.includes(currentUser.role);
    };

    // Hàm đệ quy lọc menu con 
    const filterMenuItems = (items) => {
        return items
            .filter(item => checkPermission(item.key))
            .map(item => {
                if (item.children) {
                    return { ...item, children: filterMenuItems(item.children) };
                }
                return item;
            });
    };

    // --- CẤU TRÚC MENU ---
    const allMainMenuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard'
        },
        // KINH DOANH
        {
            key: 'grp-sales',
            icon: <ShoppingOutlined />,
            label: 'Kinh Doanh',
            children: [
                { key: '/admin/orders', label: 'Đơn hàng' },
                { key: '/admin/customers', label: 'Khách hàng' },
                { key: '/admin/vouchers', label: 'Mã giảm giá' },
            ]
        },
        // HÀNG HÓA & KHO
        {
            key: 'grp-inventory',
            icon: <DatabaseOutlined />,
            label: 'Hàng Hóa & Kho',
            children: [
                { key: '/admin/products', label: 'Sản phẩm' },
                { key: '/admin/categories', label: 'Danh mục' },
                { key: '/admin/inventory', label: 'Nhập kho' },
                { key: '/admin/shipping', label: 'Vận chuyển' },
            ]
        },
        // CSKH & MARKETING
        {
            key: 'grp-marketing',
            icon: <CustomerServiceOutlined />,
            label: 'CSKH & Marketing',
            children: [
                { key: '/admin/chat', label: 'Tin nhắn (Chat)' },
                { key: '/admin/reviews', label: 'Đánh giá' },
                { key: '/admin/minigames', label: 'Minigame' },
                { key: '/admin/cms/banners', label: 'Banner & Blog' },
            ]
        },
        // QUẢN TRỊ HỆ THỐNG
        {
            key: 'grp-system',
            icon: <SafetyCertificateOutlined />,
            label: 'Hệ Thống',
            children: [
                { key: '/admin/staff', label: 'Nhân viên' },
                { key: '/admin/activity-logs', label: 'Nhật ký hoạt động' },
            ]
        },
    ];

    const allBottomMenuItems = [
        { key: '/admin/settings', icon: <SettingOutlined />, label: 'Cài đặt tài khoản' },
    ];

    // --- LỌC MENU ---
    const visibleMainMenu = filterMenuItems(allMainMenuItems);
    const visibleBottomMenu = filterMenuItems(allBottomMenuItems);

    // Logic Active Menu & Breadcrumb
    const currentPath = location.pathname;

    const findLabel = (items, path) => {
        for (const item of items) {
            if (item.key === path) return item.label;
            if (item.children) {
                const childLabel = findLabel(item.children, path);
                if (childLabel) return childLabel;
            }
        }
        return null;
    };

    const currentBreadcrumb = findLabel([...allMainMenuItems, ...allBottomMenuItems], currentPath) || 'Trang chủ';
    const activeKey = currentPath;

    const getOpenKeys = () => {
        for (const item of allMainMenuItems) {
            if (item.children && item.children.find(c => c.key === activeKey)) {
                return [item.key];
            }
        }
        return [];
    };

    // --- XỬ LÝ DROPDOWN USER (Fix cho Antd v5) ---
    const userMenu = {
        items: [
            { 
                key: '1', 
                label: 'Cài đặt', 
                onClick: () => navigate('/admin/settings') 
            },
            { 
                key: '2', 
                label: 'Đăng xuất', 
                danger: true, 
                onClick: () => {
                    authService.logout(); // Sử dụng authService để clear user và báo event
                    navigate('/admin/login');
                } 
            }
        ]
    };

    return (
        <Layout className="min-h-screen bg-[#F4F7FE] font-sans">
            {/* SIDEBAR */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={280}
                collapsedWidth={90}
                theme="light"
                className="border-none shadow-premium"
                style={{
                    position: 'fixed', 
                    height: '100vh', 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    zIndex: 100,
                    backgroundColor: '#ffffff'
                }}
            >
                <div className="flex flex-col h-full bg-white relative overflow-hidden">
                    {/* Decorative bubble */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-60"></div>

                    {/* Logo Section */}
                    <div className="h-28 flex items-center justify-center px-6 relative z-10">
                        <div className={`flex items-center gap-3 transition-all duration-500 ${collapsed ? 'scale-90' : 'scale-100'}`}>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-100 flex-shrink-0">
                                <ShoppingOutlined className="text-xl" />
                            </div>
                            {!collapsed && (
                                <div className="leading-tight">
                                    <h1 className="text-xl font-black text-[#2B3674] tracking-tighter m-0 uppercase">Rosee</h1>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] m-0">Admin Panel</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-4 py-2 relative z-10">
                        <div className="h-px bg-gray-50 w-full mb-6"></div>
                    </div>

                    {/* Main Navigation */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 relative z-10">
                        <Menu
                            mode="inline"
                            theme="light"
                            defaultOpenKeys={getOpenKeys()}
                            selectedKeys={[activeKey]}
                            items={visibleMainMenu}
                            onClick={({ key }) => navigate(key)}
                            className="border-none font-bold text-gray-500 admin-sidebar-menu"
                        />
                    </div>

                    {/* Bottom Navigation */}
                    <div className="px-3 pb-6 relative z-10">
                        <div className="h-px bg-gray-50 w-full mb-4"></div>
                        <Menu
                            mode="inline"
                            theme="light"
                            selectedKeys={[activeKey]}
                            items={visibleBottomMenu}
                            onClick={({ key }) => navigate(key)}
                            className="border-none font-bold text-gray-500 admin-sidebar-menu"
                        />
                    </div>
                </div>
            </Sider>

            {/* CONTENT AREA */}
            <Layout
                className="bg-[#F4F7FE] transition-all duration-300 ease-in-out"
                style={{ marginLeft: collapsed ? 90 : 280 }}
            >
                {/* HEADER */}
                <Header 
                    style={{
                        padding: 0,
                        height: 'auto',
                        lineHeight: 'normal',
                        background: 'transparent'
                    }}
                    className="px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-50 transition-all duration-300"
                >
                    {/* Left Side: Breadcrumb & Title */}
                    <div className="flex flex-col mb-4 md:mb-0">
                        <Breadcrumb 
                            className="text-gray-400 font-medium mb-1"
                            items={[
                                { title: <span className="text-[11px] uppercase tracking-widest opacity-60">Management</span> },
                                { title: <span className="text-[11px] uppercase tracking-widest font-black text-[#2B3674]">{currentBreadcrumb}</span> }
                            ]}
                        />
                        
                        <div className="flex items-center gap-3">
                            <Button 
                                type="text" 
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                                onClick={() => setCollapsed(!collapsed)} 
                                className="flex md:hidden bg-white shadow-sm border border-gray-100 rounded-xl" 
                            />
                            <h2 className="text-3xl font-black text-[#2B3674] m-0 tracking-tighter capitalize">
                                {currentBreadcrumb}
                            </h2>
                        </div>
                    </div>

                    {/* Right Side: Search & Actions with Glassmorphism */}
                    <div className="flex items-center gap-3 p-2 bg-white/70 backdrop-blur-xl rounded-3xl shadow-premium border border-white/50 w-full md:w-auto">

                        {/* Search Input */}
                        <div className="flex items-center bg-[#F4F7FE] rounded-2xl px-4 py-2 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 group flex-1 md:flex-none">
                            <SearchOutlined className="text-gray-400 group-focus-within:text-blue-500" />
                            <Input 
                                placeholder="Tìm kiếm nhanh..." 
                                variant="borderless" 
                                className="text-sm font-medium bg-transparent shadow-none w-full md:w-[180px] border-none outline-none" 
                            />
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 px-2">
                            <div className="relative group">
                                <Button 
                                    type="text" 
                                    icon={<BellOutlined />} 
                                    className="text-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl w-10 h-10 transition-colors"
                                />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </div>
                            
                            <Button 
                                type="text" 
                                icon={<InfoCircleOutlined />} 
                                className="text-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl w-10 h-10 transition-colors hidden sm:flex items-center justify-center"
                            />
                            
                            <div className="w-px h-6 bg-gray-100 mx-1 hidden sm:block"></div>

                            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']} arrow>
                                <div className="flex items-center gap-2 p-1 pl-2 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors group">
                                    <div className="text-right leading-tight hidden lg:block">
                                        <p className="text-[11px] font-black text-[#2B3674] m-0 uppercase tracking-tight">{currentUser.name}</p>
                                        <p className="text-[10px] font-bold text-blue-400 m-0 capitalize">{currentUser.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                                    </div>
                                    <Avatar 
                                        className="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md group-hover:scale-105 transition-transform" 
                                        icon={<UserOutlined />} 
                                        size={40}
                                    />
                                </div>
                            </Dropdown>
                        </div>
                    </div>
                </Header>

                {/* MAIN CONTENT ROUTER */}
                <Content className="m-4 md:m-6 mt-2">
                    <div className="bg-transparent min-h-[70vh] rounded-xl">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;