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
        let bg, dot, text, textColor;
        switch (rank) {
          case 'Gold':
            bg = 'bg-amber-50'; dot = 'bg-amber-500'; textColor = 'text-amber-700'; text = 'Gold Member'; break;
          case 'Silver':
            bg = 'bg-slate-50'; dot = 'bg-slate-400'; textColor = 'text-slate-700'; text = 'Silver Member'; break;
          default:
            bg = 'bg-orange-50'; dot = 'bg-orange-400'; textColor = 'text-orange-700'; text = 'Bronze Member';
        }
        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg} ${textColor} border border-transparent`}>
            <span className={`w-2 h-2 rounded-full ${dot}`}></span>
            <span className="text-[10px] font-black uppercase tracking-wider">{text}</span>
          </div>
        );
    };

    const columns = [
        {
            title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Thông tin khách hàng</span>,
            dataIndex: 'name',
            render: (text, record) => (
                <div className="flex items-center gap-4 py-2 pl-2 group/card cursor-pointer" onClick={() => showDetail(record)}>
                    <Avatar 
                      src={record.avatar || undefined} 
                      size={52} 
                      className="rounded-2xl border-2 border-white shadow-sm group-hover/card:scale-110 transition-transform duration-500"
                      icon={<UserOutlined />}
                    />
                    <div className="flex flex-col">
                        <h5 className="font-black text-[#2B3674] text-sm m-0 hover:text-blue-600 transition-colors leading-tight">{text}</h5>
                        <span className="text-[10px] font-bold text-gray-400 lowercase truncate max-w-[150px]">{record.email}</span>
                    </div>
                </div>
            ),
        },
        {
            title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Hạng hội viên</span>,
            dataIndex: 'rank',
            render: (rank) => renderRank(rank || 'Bronze'),
        },
        {
            title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Chi tiêu (Lũy kế)</span>,
            dataIndex: 'totalSpent',
            align: 'center',
            render: (val) => <span className="font-black text-[#2B3674]">{(val || 0).toLocaleString()} đ</span>,
            sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
        },
        {
            title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Đơn hàng</span>,
            dataIndex: 'orderCount',
            align: 'center',
            render: (val) => (
              <div className="inline-flex items-center justify-center min-w-[32px] h-8 bg-[#F4F7FE] rounded-lg font-black text-[#2B3674] text-xs">
                {val || 0}
              </div>
            ),
        },
        {
            title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</span>,
            dataIndex: 'status',
            render: (status) => {
                const isBlocked = status === 'Blocked';
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'} ${!isBlocked && 'animate-pulse'}`}></span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{isBlocked ? 'Đã khóa' : 'Hoạt động'}</span>
                  </div>
                );
            },
        },
        {
            title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-right pr-2">Thao tác</span>,
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Dropdown menu={{ items: [
                    { key: 'view', label: <span className="font-bold">Hồ sơ chi tiết</span>, icon: <UserOutlined className="text-blue-500" />, onClick: () => showDetail(record) },
                    { key: 'edit', label: <span className="font-bold">Cập nhật thông tin</span>, icon: <EditOutlined className="text-amber-500" />, onClick: () => handleEdit(record) },
                    { type: 'divider' },
                    { 
                      key: 'block', 
                      label: <span className="font-bold">{record.status === 'Blocked' ? 'Mở khóa tài khoản' : 'Khóa truy cập'}</span>, 
                      icon: <StopOutlined />, 
                      danger: record.status !== 'Blocked', 
                      onClick: () => handleToggleBlock(record) 
                    },
                ] }} placement="bottomRight" arrow>
                    <Button type="text" className="hover:bg-blue-50 rounded-xl mr-2" icon={<MoreOutlined className="text-gray-400 text-lg" />} />
                </Dropdown>
            ),
        },
    ];

    // --- NỘI DUNG DRAWER CHI TIẾT ---
    const renderCustomerDetailContent = () => (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header Profile */}
            <div className="flex items-center gap-6 mb-8 p-8 bg-gradient-to-br from-[#4318FF] to-[#707EAE] rounded-[32px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                <Avatar 
                  src={selectedCustomer?.avatar || undefined} 
                  size={100} 
                  className="border-4 border-white/30 shadow-2xl shrink-0" 
                  icon={<UserOutlined />}
                />
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white m-0 tracking-tighter">{selectedCustomer?.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-white/20">
                          {selectedCustomer?.rank || 'Bronze'} Member
                        </span>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white/80 text-[10px] font-black rounded-full uppercase tracking-widest border border-white/10">
                          ID: {selectedCustomer?._id?.slice(-8).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <Row gutter={20} className="mb-8">
                <Col span={8}>
                    <div className="bg-[#F4F7FE] p-5 rounded-[24px] border border-transparent hover:border-blue-100 transition-all text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng chi tiêu</p>
                        <h3 className="text-xl font-black text-[#2B3674] m-0 tracking-tighter">{(selectedCustomer?.totalSpent || 0).toLocaleString()}đ</h3>
                    </div>
                </Col>
                <Col span={8}>
                    <div className="bg-[#F4F7FE] p-5 rounded-[24px] border border-transparent hover:border-blue-100 transition-all text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đơn hàng</p>
                        <h3 className="text-xl font-black text-[#2B3674] m-0 tracking-tighter">{selectedCustomer?.orderCount || 0}</h3>
                    </div>
                </Col>
                <Col span={8}>
                    <div className="bg-[#F4F7FE] p-5 rounded-[24px] border border-transparent hover:border-blue-100 transition-all text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Điểm thưởng</p>
                        <h3 className="text-xl font-black text-amber-500 m-0 tracking-tighter">{selectedCustomer?.points || 0}</h3>
                    </div>
                </Col>
            </Row>

            {/* Detail Tabs */}
            <Tabs 
              defaultActiveKey="1" 
              className="premium-tabs"
              items={[
                {
                    key: '1', 
                    label: <span className="font-black uppercase tracking-widest text-[11px]">Thông tin sở hữu</span>,
                    children: (
                        <div className="flex flex-col gap-4 mt-4 animate-in fade-in duration-300">
                            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-[20px] shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl"><MailOutlined /></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest m-0">Email</p><p className="font-black text-[#2B3674] m-0">{selectedCustomer?.email}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-[20px] shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl"><PhoneOutlined /></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest m-0">Số điện thoại</p><p className="font-black text-[#2B3674] m-0">{selectedCustomer?.phone}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-[20px] shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-2xl"><EnvironmentOutlined /></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest m-0">Địa chỉ giao hàng</p><p className="font-black text-[#2B3674] m-0">{selectedCustomer?.address || 'Chưa cập nhật'}</p></div>
                            </div>
                        </div>
                    )
                },
                {
                    key: '2', 
                    label: <span className="font-black uppercase tracking-widest text-[11px]">Lịch sử giao dịch</span>,
                    children: (
                        <div className="mt-4 px-2">
                           <List
                                dataSource={MOCK_HISTORY}
                                renderItem={item => (
                                    <List.Item className="border-b border-gray-50 py-4 hover:bg-gray-50/50 rounded-xl px-3 transition-colors">
                                        <List.Item.Meta
                                            avatar={<div className="w-12 h-12 bg-[#F4F7FE] text-blue-600 rounded-2xl flex items-center justify-center text-xl"><HistoryOutlined /></div>}
                                            title={<span className="font-black text-[#2B3674]">{item.id}</span>}
                                            description={<span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.date}</span>}
                                        />
                                        <div className="text-right">
                                            <div className="font-black text-[#2B3674]">{item.total}</div>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                              {item.status}
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </div>
                    )
                }
            ]} />
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2">
                <h3 className="text-2xl font-black text-[#2B3674] m-0 tracking-tighter"></h3>
                {/* Statistics Summary if needed */}
                <div className="flex gap-2">
                  <span className="px-4 py-2 bg-[#F4F7FE] rounded-2xl text-[11px] font-black text-blue-600 uppercase tracking-widest border border-white/50">
                    Sức khỏe CRM: <span className="text-[#2B3674]">Tốt</span>
                  </span>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-premium border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>

                <div className="flex flex-wrap gap-4 mb-8 justify-between items-center relative z-10">
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        <div className="relative group">
                           <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-20" />
                           <Input 
                               placeholder="Tìm khách hàng theo tên hoặc email..." 
                               className="w-full sm:w-[320px] h-[48px] rounded-2xl border-none bg-[#F4F7FE] pl-11 pr-4 font-bold text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" 
                               onChange={(e) => setSearchText(e.target.value)}
                               allowClear
                           />
                        </div>
                        <Select defaultValue="all" className="h-[48px] w-[180px] premium-select">
                            <Option value="all">Tất cả hạng</Option>
                            <Option value="gold">Hạng Gold</Option>
                            <Option value="silver">Hạng Silver</Option>
                            <Option value="bronze">Hạng Bronze</Option>
                        </Select>
                    </div>
                </div>

                <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={{ 
                      pageSize: 6,
                      className: "premium-pagination" 
                    }} 
                    className="premium-admin-table" 
                    loading={loading}
                    rowClassName="group hover:bg-blue-50/20 transition-colors cursor-pointer"
                />
            </div>

            {/* Drawer Chi Tiết */}
            <Drawer
                title={<span className="font-black uppercase tracking-widest text-xs text-gray-400">Hồ sơ khách hàng chi tiết</span>}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                size="large"
                className="premium-drawer"
                closeIcon={null}
                extra={
                  <Button type="text" onClick={() => setDrawerVisible(false)} className="font-black text-gray-400 hover:text-blue-600">Đóng</Button>
                }
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