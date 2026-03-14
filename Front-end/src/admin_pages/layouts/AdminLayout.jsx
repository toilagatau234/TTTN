import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Dropdown, Button, Breadcrumb } from 'antd';
import {
    MenuUnfoldOutlined, MenuFoldOutlined, SearchOutlined, BellOutlined, InfoCircleOutlined,
    UserOutlined, DashboardOutlined, SettingOutlined, SafetyCertificateOutlined,
    DatabaseOutlined, CustomerServiceOutlined, ShoppingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { MENU_PERMISSIONS } from '../../constants/roles';

const { Header, Sider, Content } = Layout;

// Giả lập hàm lấy user (bọc try catch chống crash)
const getCurrentUser = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user || { "name": "Admin", "role": "Admin" };
    } catch (error) {
        return { "name": "Admin", "role": "staff" };
    }
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
                    localStorage.removeItem('user'); // Clear user khi đăng xuất
                    navigate('/admin/login');
                } 
            }
        ]
    };

    return (
        <Layout className="min-h-screen bg-[#F4F7FE]">
            {/* SIDEBAR */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                collapsedWidth={80}
                theme="light" // Thêm theme light để chuẩn màu Antd
                className="border-r border-gray-100 shadow-sm"
                style={{
                    position: 'fixed', 
                    height: '100vh', 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    zIndex: 100,
                }}
            >
                <div className="flex flex-col h-full bg-white">
                    {/* Logo */}
                    <div className="h-24 flex items-center justify-center flex-shrink-0">
                        <h1 className={`font-bold text-blue-600 transition-all duration-300 ${collapsed ? 'text-sm' : 'text-2xl'}`}>
                            {collapsed ? 'FLW' : 'FLOWER SHOP'}
                        </h1>
                    </div>

                    {/* Menu Chính */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <Menu
                            mode="inline"
                            theme="light"
                            defaultOpenKeys={getOpenKeys()}
                            selectedKeys={[activeKey]}
                            items={visibleMainMenu}
                            onClick={({ key }) => navigate(key)}
                            className="border-none px-2 font-medium text-gray-600"
                        />
                    </div>

                    {/* Menu Đáy */}
                    <div className="flex-shrink-0 pb-4 bg-white">
                        <div className="mx-4 my-2 border-t border-gray-200"></div>
                        <Menu
                            mode="inline"
                            theme="light"
                            selectedKeys={[activeKey]}
                            items={visibleBottomMenu}
                            onClick={({ key }) => navigate(key)}
                            className="border-none px-2 font-medium text-gray-600"
                        />
                    </div>
                </div>
            </Sider>

            {/* CONTENT AREA */}
            <Layout
                className="bg-[#F4F7FE] transition-all duration-200 ease-in-out"
                style={{ marginLeft: collapsed ? 80 : 260 }}
            >
                {/* HEADER */}
                <Header 
                    style={{
                        padding: 0,             // Ghi đè padding mặc định của AntD
                        height: 'auto',         // Ghi đè height 64px của AntD
                        lineHeight: 'normal',   // Ghi đè line-height 64px của AntD
                        background: 'transparent'
                    }}
                    className="px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-50 backdrop-blur-xl bg-[#F4F7FE]/80"
                >
                    {/* Phần Trái: Breadcrumb & Title */}
                    <div className="flex flex-col mb-4 md:mb-0 w-full md:w-auto">
                        <Breadcrumb 
                            className="text-sm text-gray-500 mb-1"
                            items={[
                                {
                                    title: 'pages'
                                },
                                {
                                    title: <span className='text-gray-800 font-medium'>{currentBreadcrumb} </span>
                                }
                            ]}
                        />
                        
                        <div className="flex items-center gap-2">
                            {/* Nút thu/phóng Menu cho Mobile (chỉ hiện trên màn hình nhỏ) */}
                            <Button 
                                type="text" 
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                                onClick={() => setCollapsed(!collapsed)} 
                                className="flex md:hidden text-lg p-0 w-8 h-8 flex-shrink-0 text-gray-600" 
                            />
                            <h2 className="text-2xl md:text-3xl font-bold text-[#2B3674] m-0 tracking-tight">
                                {currentBreadcrumb}
                            </h2>
                        </div>
                    </div>

                    {/* Phần Phải: Search & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 p-2 bg-white rounded-full shadow-sm w-full md:w-auto">

                        {/* Ô Tìm kiếm */}
                        <div className="flex items-center bg-[#F4F7FE] rounded-full px-4 py-1.5 flex-1 md:flex-none md:w-[220px]">
                            <SearchOutlined className="text-gray-400 mr-2" />
                            <Input 
                                placeholder="Tìm kiếm..." 
                                variant="outlined" 
                                className="p-0 text-sm bg-transparent shadow-none focus:ring-0 w-full" 
                            />
                        </div>
                        
                        {/* Các icon thông báo & Avatar */}
                        <div className="flex items-center gap-3 pr-2 flex-shrink-0">
                            <BellOutlined className="text-xl text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
                            <InfoCircleOutlined className="text-xl text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
                            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                                <Avatar 
                                    className="bg-blue-600 cursor-pointer transform hover:scale-105 transition-transform shadow-md flex-shrink-0" 
                                    icon={<UserOutlined />} 
                                />
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