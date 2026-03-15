import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Avatar, Drawer, Tabs, List, Card, Row, Col, Statistic, Dropdown, Menu, message } from 'antd';
import {
    PlusOutlined, SearchOutlined, UserOutlined,
    ShoppingOutlined, DollarOutlined, EnvironmentOutlined,
    HistoryOutlined, MoreOutlined, EditOutlined, StopOutlined,
    SafetyCertificateOutlined, MailOutlined, PhoneOutlined
} from '@ant-design/icons';
import CreateCustomerModal from './components/CreateCustomerModal';
import UpdateCustomerModal from './components/UpdateCustomerModal';
import userService from '../../../services/userService';

const { Option } = Select;

// --- DỮ LIỆU GIẢ LẬP NÂNG CAO ---
const MOCK_HISTORY = [
    { id: '#ORD-992', date: '30/01/2026', total: '1,200,000đ', status: 'Completed' },
    { id: '#ORD-980', date: '15/01/2026', total: '850,000đ', status: 'Completed' },
    { id: '#ORD-901', date: '01/01/2026', total: '2,500,000đ', status: 'Cancelled' },
];

const CustomersPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Fetch data from API
    const fetchCustomers = async (search = '') => {
        setLoading(true);
        try {
            const res = await userService.getAll({ role: 'User', search });
            if (res.success) {
                // Map key for AntD table
                const formattedData = res.data.map(item => ({
                    ...item,
                    key: item._id
                }));
                setData(formattedData);
            }
        } catch (error) {
            console.error("Failed to load customers", error);
            message.error("Không thể tải danh sách khách hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers(searchText);
    }, [searchText]);

    // Mở chi tiết khách hàng
    const showDetail = (record) => {
        setSelectedCustomer(record);
        setDrawerVisible(true);
    };

    const handleCreate = async (newItem) => {
        try {
            const res = await userService.add(newItem);
            if (res && (res.success || res._id)) {
                message.success("Thêm khách hàng thành công");
                fetchCustomers(searchText);
                setIsModalOpen(false);
            } else {
                message.error(res?.message || "Không thể tạo khách hàng");
            }
        } catch (error) {
            console.error("Create customer error:", error);
            message.error(error.response?.data?.message || "Không thể tạo khách hàng");
            throw error;
        }
    };

    const handleUpdate = async (id, updatedItem) => {
        try {
            const res = await userService.update(id, updatedItem);
            if (res && (res.success || res._id)) {
                message.success("Cập nhật khách hàng thành công");
                fetchCustomers(searchText);
                setIsEditModalOpen(false);
            } else {
                message.error(res?.message || "Không thể cập nhật khách hàng");
            }
        } catch (error) {
            console.error("Update customer error:", error);
            message.error(error.response?.data?.message || "Không thể cập nhật");
        }
    };

    const handleEdit = (record) => {
        setEditingCustomer(record);
        setIsEditModalOpen(true);
    };

    const handleToggleBlock = async (record) => {
        try {
            const newStatus = record.status === 'Blocked' ? 'Active' : 'Blocked';
            const res = await userService.update(record._id, { status: newStatus });
            if (res && (res.success || res._id)) {
                message.success(`${newStatus === 'Blocked' ? 'Khóa' : 'Mở khóa'} tài khoản thành công`);
                fetchCustomers(searchText);
            } else {
                message.error("Thao tác thất bại");
            }
        } catch (error) {
            console.error("Toggle block error:", error);
            message.error("Thao tác thất bại");
        }
    };

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
                    <Avatar src={record.avatar || undefined} size={40} />
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
            render: (rank) => renderRank(rank || 'Bronze'),
        },
        {
            title: 'CHI TIÊU',
            dataIndex: 'totalSpent',
            render: (val) => <span className="font-bold text-navy-700">{(val || 0).toLocaleString()} d</span>,
            sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
        },
        {
            title: 'ĐƠN HÀNG',
            dataIndex: 'orderCount',
            render: (val) => <div className="text-center w-10 bg-gray-100 rounded-md font-bold text-sm">{val || 0}</div>,
        },
        {
            title: 'TRẠNG THÁI',
            dataIndex: 'status',
            render: (status) => (
                <Tag color={status === 'Blocked' ? 'red' : 'green'}>{status === 'Blocked' ? 'Đã khóa' : 'Hoạt động'}</Tag>
            ),
        },
        {
            title: '',
            key: 'action',
            render: (_, record) => (
                <Dropdown menu={{ items: [
                    { key: '1', label: 'Xem chi tiết', icon: <UserOutlined />, onClick: () => showDetail(record) },
                    { key: '2', label: 'Sửa thông tin', icon: <EditOutlined />, onClick: () => handleEdit(record) },
                    { key: '3', label: record.status === 'Blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản', icon: <StopOutlined />, danger: record.status !== 'Blocked', onClick: () => handleToggleBlock(record) },
                ] }}>
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    // --- NỘI DUNG DRAWER CHI TIẾT ---
    const renderCustomerDetailContent = () => (
        <div>
            {/* Header Profile */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-white rounded-2xl">
                <Avatar src={selectedCustomer?.avatar || 'https://i.pravatar.cc/150?img=11'} size={80} className="border-4 border-white shadow-sm" />
                <div>
                    <h2 className="text-2xl font-bold text-navy-700 m-0">{selectedCustomer?.name}</h2>
                    <div className="flex gap-2 mt-2">
                        {renderRank(selectedCustomer?.rank || 'Bronze')}
                        <Tag>Tham gia: {selectedCustomer?.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}</Tag>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <Row gutter={16} className="mb-6">
                <Col span={8}>
                    <Card size="small" className="rounded-xl bg-gray-50 border-none">
                        <Statistic title="Tổng chi tiêu" value={selectedCustomer?.totalSpent} suffix="đ" styles={{ value: { color: '#4318FF', fontWeight: 'bold' } }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" className="rounded-xl bg-gray-50 border-none">
                        <Statistic title="Số đơn hàng" value={selectedCustomer?.orderCount} prefix={<ShoppingOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" className="rounded-xl bg-gray-50 border-none">
                        <Statistic title="Điểm thưởng" value={selectedCustomer?.points} prefix={<DollarOutlined />} styles={{ value: { color: '#FAAD14' } }} />
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
                {/* Thêm Khách Mới button removed per user request */}
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm">
                <div className="flex justify-between mb-4">
                    <div className="flex gap-3">
                        <Input 
                            prefix={<SearchOutlined className="text-gray-400" />} 
                            placeholder="Tìm khách hàng..." 
                            className="w-[250px] rounded-xl h-[40px] bg-[#F4F7FE] border-none" 
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl">
                            <Option value="all">Tất cả hạng</Option>
                            <Option value="gold">Gold</Option>
                        </Select>
                    </div>
                </div>
                <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={{ pageSize: 6 }} 
                    className="custom-table-metrix" 
                    loading={loading}
                />
            </div>

            {/* Drawer Chi Tiết */}
            <Drawer
                title="Hồ sơ khách hàng"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                size="large"
                className="custom-drawer-metrix"
            >
                {selectedCustomer && renderCustomerDetailContent()}
            </Drawer>

            <CreateCustomerModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
            <UpdateCustomerModal 
                open={isEditModalOpen} 
                onCancel={() => setIsEditModalOpen(false)} 
                onUpdate={handleUpdate} 
                customer={editingCustomer} 
            />
        </div>
    );
};

export default CustomersPage;