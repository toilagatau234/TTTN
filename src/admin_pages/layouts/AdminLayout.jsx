import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Dropdown, Button, Breadcrumb } from 'antd';
import {
    MenuUnfoldOutlined, MenuFoldOutlined, SearchOutlined, BellOutlined, InfoCircleOutlined,
    UserOutlined, DashboardOutlined, ShoppingCartOutlined, FileTextOutlined,
    TeamOutlined, TagsOutlined, GiftOutlined, SettingOutlined,
    MessageOutlined, CommentOutlined, ShopOutlined, BarcodeOutlined, HistoryOutlined,
    IdcardOutlined, PictureOutlined, ReadOutlined, AppstoreAddOutlined, CarOutlined,
    ShoppingOutlined, DatabaseOutlined, CustomerServiceOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { MENU_PERMISSIONS } from '../../constants/roles';

const { Header, Sider, Content } = Layout;

// Giả lập hàm lấy user
const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user || {"name": "Admin", "role": "Admin"};
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

    // --- CẤU TRÚC MENU MỚI ---
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
                { key: '/admin/shipping', label: 'Vận chuyển' }, // Chuyển Shipping vào đây hoặc nhóm riêng
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
                { key: '/admin/cms/banners', label: 'Banner & Blog' }, // Gộp CMS vào đây
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

    // Danh sách MENU ĐÁY
    const allBottomMenuItems = [
        { key: '/admin/settings', icon: <SettingOutlined />, label: 'Cài đặt tài khoản' },
    ];

    // --- LỌC MENU ---
    const visibleMainMenu = filterMenuItems(allMainMenuItems);
    const visibleBottomMenu = filterMenuItems(allBottomMenuItems);

    // Logic Active Menu & Breadcrumb
    const currentPath = location.pathname;
    
    // Hàm tìm label cho Breadcrumb
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
    
    // Tìm key đang active và key của SubMenu cần mở 
    const activeKey = currentPath;
    
    // Xác định SubMenu nào chứa activeKey để auto-open
    const getOpenKeys = () => {
        for (const item of allMainMenuItems) {
            if (item.children && item.children.find(c => c.key === activeKey)) {
                return [item.key];
            }
        }
        return [];
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
                className="border-r border-gray-100 bg-white"
                style={{
                    position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, zIndex: 100,
                }}
            >
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
                            defaultOpenKeys={getOpenKeys()} // Tự động mở nhóm đang active
                            selectedKeys={[activeKey]}
                            items={visibleMainMenu}
                            onClick={({ key }) => navigate(key)}
                            className="border-none px-2 text-base font-medium text-gray-500"
                        />
                    </div>

                    {/* Menu Đáy */}
                    <div className="flex-shrink-0 pb-4">
                        <div className="mx-4 my-2 border-t-2 border-gray-300"></div>
                        <Menu
                            mode="inline"
                            selectedKeys={[activeKey]}
                            items={visibleBottomMenu}
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