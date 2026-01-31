import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, Avatar, Drawer, Tabs, List, Card, Row, Col, Statistic, Dropdown, Menu, message } from 'antd';
import {
    PlusOutlined, SearchOutlined, UserOutlined,
    ShoppingOutlined, DollarOutlined, EnvironmentOutlined,
    HistoryOutlined, MoreOutlined, EditOutlined, StopOutlined,
    SafetyCertificateOutlined, MailOutlined, PhoneOutlined
} from '@ant-design/icons';
import CreateCustomerModal from './components/CreateCustomerModal';

const { Option } = Select;

// --- DỮ LIỆU GIẢ LẬP NÂNG CAO ---
const MOCK_CUSTOMERS = [
    {
        key: '1', id: 'CUS-001', name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0909123456',
        avatar: 'https://i.pravatar.cc/150?img=11',
        rank: 'Gold', points: 1540, totalSpent: 15500000, orderCount: 12, status: 'Active',
        address: '123 Lê Lợi, Q.1, TP.HCM',
        joinDate: '20/01/2025'
    },
    {
        key: '2', id: 'CUS-002', name: 'Trần Thị Bích', email: 'bich.tran@yahoo.com', phone: '0912345678',
        avatar: 'https://i.pravatar.cc/150?img=5',
        rank: 'Silver', points: 450, totalSpent: 4200000, orderCount: 5, status: 'Active',
        address: '45 Nguyễn Huệ, Q.1, TP.HCM',
        joinDate: '15/05/2025'
    },
    {
        key: '3', id: 'CUS-003', name: 'Lê Hoàng Cường', email: 'cuong.le@outlook.com', phone: '0987654321',
        avatar: 'https://i.pravatar.cc/150?img=3',
        rank: 'Bronze', points: 50, totalSpent: 550000, orderCount: 1, status: 'Blocked',
        address: '12 Xô Viết Nghệ Tĩnh, Bình Thạnh',
        joinDate: '10/12/2025'
    },
];

const MOCK_HISTORY = [
    { id: '#ORD-992', date: '30/01/2026', total: '1,200,000đ', status: 'Completed' },
    { id: '#ORD-980', date: '15/01/2026', total: '850,000đ', status: 'Completed' },
    { id: '#ORD-901', date: '01/01/2026', total: '2,500,000đ', status: 'Cancelled' },
];

const CustomersPage = () => {
    const [data, setData] = useState(MOCK_CUSTOMERS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Mở chi tiết khách hàng
    const showDetail = (record) => {
        setSelectedCustomer(record);
        setDrawerVisible(true);
    };

    const handleCreate = (newItem) => {
        setData([newItem, ...data]);
        setIsModalOpen(false);
    };

    const handleDelete = (key) => {
        setData(data.filter(item => item.key !== key));
        message.success('Đã xóa khách hàng');
    };

    // Render Rank Tag
    const renderRank = (rank) => {
        let color = rank === 'Gold' ? 'gold' : (rank === 'Silver' ? 'cyan' : 'orange');
        return <Tag icon={<SafetyCertificateOutlined />} color={color}>{rank} Member</Tag>;
    };

    const columns = [
        {
            title: 'KHÁCH HÀNG',
            dataIndex: 'name',
            render: (text, record) => (
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => showDetail(record)}>
                    <Avatar src={record.avatar} size={40} />
                    <div>
                        <h5 className="font-bold text-navy-700 text-sm m-0 hover:text-brand-500">{text}</h5>
                        <span className="text-gray-400 text-xs">{record.email}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'HẠNG THÀNH VIÊN',
            dataIndex: 'rank',
            render: (rank) => renderRank(rank),
        },
        {
            title: 'CHI TIÊU',
            dataIndex: 'totalSpent',
            render: (val) => <span className="font-bold text-navy-700">{val.toLocaleString()} đ</span>,
            sorter: (a, b) => a.totalSpent - b.totalSpent,
        },
        {
            title: 'ĐƠN HÀNG',
            dataIndex: 'orderCount',
            render: (val) => <div className="text-center w-10 bg-gray-100 rounded-md font-bold text-sm">{val}</div>,
        },
        {
            title: 'TRẠNG THÁI',
            dataIndex: 'status',
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'}>{status === 'Active' ? 'Hoạt động' : 'Đã khóa'}</Tag>
            ),
        },
        {
            title: '',
            key: 'action',
            render: (_, record) => (
                <Dropdown overlay={<Menu items={[
                    { key: '1', label: 'Xem chi tiết', icon: <UserOutlined />, onClick: () => showDetail(record) },
                    { key: '2', label: 'Sửa thông tin', icon: <EditOutlined /> },
                    { key: '3', label: 'Khóa tài khoản', icon: <StopOutlined />, danger: true },
                ]} />}>
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    // --- NỘI DUNG DRAWER CHI TIẾT ---
    const CustomerDetailContent = () => (
        <div>
            {/* Header Profile */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-white rounded-2xl">
                <Avatar src={selectedCustomer?.avatar} size={80} className="border-4 border-white shadow-sm" />
                <div>
                    <h2 className="text-2xl font-bold text-navy-700 m-0">{selectedCustomer?.name}</h2>
                    <div className="flex gap-2 mt-2">
                        {renderRank(selectedCustomer?.rank)}
                        <Tag>Tham gia: {selectedCustomer?.joinDate}</Tag>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <Row gutter={16} className="mb-6">
                <Col span={8}>
                    <Card size="small" className="rounded-xl bg-gray-50 border-none">
                        <Statistic title="Tổng chi tiêu" value={selectedCustomer?.totalSpent} suffix="đ" valueStyle={{ color: '#4318FF', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" className="rounded-xl bg-gray-50 border-none">
                        <Statistic title="Số đơn hàng" value={selectedCustomer?.orderCount} prefix={<ShoppingOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" className="rounded-xl bg-gray-50 border-none">
                        <Statistic title="Điểm thưởng" value={selectedCustomer?.points} prefix={<DollarOutlined />} valueStyle={{ color: '#FAAD14' }} />
                    </Card>
                </Col>
            </Row>

            {/* Detail Tabs */}
            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1', label: 'Thông tin liên hệ',
                    children: (
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl"><MailOutlined /></div>
                                <div><p className="text-xs text-gray-400 m-0">Email</p><p className="font-bold text-navy-700 m-0">{selectedCustomer?.email}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-xl"><PhoneOutlined /></div>
                                <div><p className="text-xs text-gray-400 m-0">Số điện thoại</p><p className="font-bold text-navy-700 m-0">{selectedCustomer?.phone}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xl"><EnvironmentOutlined /></div>
                                <div><p className="text-xs text-gray-400 m-0">Địa chỉ mặc định</p><p className="font-bold text-navy-700 m-0">{selectedCustomer?.address}</p></div>
                            </div>
                        </div>
                    )
                },
                {
                    key: '2', label: 'Lịch sử mua hàng',
                    children: (
                        <List
                            dataSource={MOCK_HISTORY}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><HistoryOutlined /></div>}
                                        title={<span className="font-bold">{item.id}</span>}
                                        description={item.date}
                                    />
                                    <div className="text-right">
                                        <div className="font-bold text-navy-700">{item.total}</div>
                                        <Tag color={item.status === 'Completed' ? 'green' : 'red'}>{item.status}</Tag>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )
                }
            ]} />
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    
                </div>
                {/* <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} className="bg-brand-500 h-10 px-6 rounded-xl font-bold border-none">
                    Thêm Khách Mới
                </Button> */}
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm">
                <div className="flex justify-between mb-4">
                    <div className="flex gap-3">
                        <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm khách hàng..." className="w-[250px] rounded-xl h-[40px] bg-[#F4F7FE] border-none" />
                        <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl"><Option value="all">Tất cả hạng</Option><Option value="gold">Gold</Option></Select>
                    </div>
                </div>
                <Table columns={columns} dataSource={data} pagination={{ pageSize: 6 }} className="custom-table-metrix" />
            </div>

            {/* Drawer Chi Tiết */}
            <Drawer
                title="Hồ sơ khách hàng"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={500}
                className="custom-drawer-metrix"
            >
                {selectedCustomer && <CustomerDetailContent />}
            </Drawer>

            <CreateCustomerModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
        </div>
    );
};

export default CustomersPage;