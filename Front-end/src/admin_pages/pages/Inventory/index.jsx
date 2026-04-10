import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, DatePicker, message, Modal, Descriptions, Divider, Typography, Tabs } from 'antd';
import inventoryService from '../../../services/inventoryService';
import { PlusOutlined, SearchOutlined, EyeOutlined, FileTextOutlined, TeamOutlined, WarningOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Title } = Typography;

// Widget Thống kê
const InventoryStat = ({ title, value, color }) => (
    <div className="bg-white p-5 rounded-[20px] shadow-sm">
        <p className="text-gray-400 text-xs font-bold uppercase mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
    </div>
);

const InventoryPage = () => {
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [adjustmentPagination, setAdjustmentPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    
    // Stats State
    const [stats, setStats] = useState({ inventoryValue: 0, monthImportCount: 0, monthImportCost: 0, topSupplierName: 'N/A' });

    // Detail Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [fetchingDetail, setFetchingDetail] = useState(false);

    const fetchImports = async (page = 1, dates = dateRange) => {
        setLoading(true);
        try {
            const query = { page, limit: pagination.pageSize };
            if (dates && dates.length === 2) {
                query.startDate = dates[0].format('YYYY-MM-DD');
                query.endDate = dates[1].format('YYYY-MM-DD');
            }
            const res = await inventoryService.getImports(query);
            if (res.success) {
                const mapped = res.data.map(item => ({
                    key: item._id,
                    id: item._id.substring(item._id.length - 6).toUpperCase(), // Giả lập hiển thị mã ID ngắn
                    supplier: item.supplierId?.name || 'N/A',
                    date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
                    total: item.totalAmount,
                    status: item.status,
                    creator: item.importedBy?.name || 'Admin',
                    fullData: item
                }));
                setData(mapped);
                setPagination(prev => ({ ...prev, current: res.pagination.page, total: res.pagination.total }));
            }
        } catch (error) {
            message.error('Lỗi tải danh sách phiếu nhập');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdjustments = async (page = 1, dates = dateRange) => {
        setLoading(true);
        try {
            const query = { page, limit: adjustmentPagination.pageSize };
            if (dates && dates.length === 2) {
                query.startDate = dates[0].format('YYYY-MM-DD');
                query.endDate = dates[1].format('YYYY-MM-DD');
            }
            const res = await inventoryService.getAdjustments(query);
            if (res.success) {
                setAdjustments(res.data.map(item => ({...item, key: item._id})));
                setAdjustmentPagination(prev => ({ ...prev, current: res.pagination.page, total: res.pagination.total }));
            }
        } catch (error) {
            message.error('Lỗi tải danh sách kiểm kê');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await inventoryService.getStats();
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            console.error("Lỗi get stats", error);
        }
    }

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchImports(1, dateRange);
        fetchAdjustments(1, dateRange);
    }, [dateRange]);

    const handleTableChange = (pag) => {
        fetchImports(pag.current, dateRange);
    };
    
    const handleAdjustmentTableChange = (pag) => {
        fetchAdjustments(pag.current, dateRange);
    };

    const handleViewDetail = async (id) => {
        setFetchingDetail(true);
        setIsModalOpen(true);
        try {
            const res = await inventoryService.getImportDetail(id);
            if (res.success) {
                setSelectedRecord(res.data);
            }
        } catch (error) {
            message.error('Lỗi khi lấy chi tiết phiếu nhập');
            setIsModalOpen(false);
        } finally {
            setFetchingDetail(false);
        }
    };

    const columns = [
        { title: 'MÃ PHIẾU', dataIndex: 'id', render: t => <span className="font-bold text-brand-500 cursor-pointer">#{t}</span> },
        { title: 'NHÀ CUNG CẤP', dataIndex: 'supplier', render: t => <span className="font-bold text-navy-700">{t}</span> },
        { title: 'NGÀY NHẬP', dataIndex: 'date', render: t => <span className="text-gray-500">{t}</span> },
        { title: 'TỔNG TIỀN', dataIndex: 'total', render: t => <span className="font-bold text-navy-700">{t.toLocaleString('vi-VN')} đ</span> },
        {
            title: 'TRẠNG THÁI', dataIndex: 'status',
            render: s => <Tag color={s === 'completed' ? 'green' : 'red'}>{s === 'completed' ? 'Đã nhập kho' : 'Đã hủy/Khác'}</Tag>
        },
        {
            title: 'THAO TÁC',
            render: (_, record) => (
                <Button 
                  icon={<EyeOutlined />} 
                  size="small" 
                  className="border-gray-200 text-gray-500"
                  onClick={() => handleViewDetail(record.key)}
                >
                  Chi tiết
                </Button>
            )
        }
    ];

    const detailColumns = [
        { title: 'Sản phẩm', dataIndex: 'productId', key: 'name', render: p => <b>{p?.name || 'Sản phẩm đã xóa'}</b> },
        { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center' },
        { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: val => `${val.toLocaleString()} đ` },
        { title: 'Thành tiền', key: 'amount', align: 'right', render: (_, record) => <b>{(record.quantity * record.unitPrice).toLocaleString()} đ</b> }
    ];

    const adjustmentColumns = [
        { title: 'MÃ PHIẾU', dataIndex: '_id', render: t => <span className="font-bold text-orange-500 cursor-pointer">#{t.substring(t.length - 6).toUpperCase()}</span> },
        { title: 'SẢN PHẨM', dataIndex: 'productId', render: p => <span className="font-bold text-navy-700">{p?.name || 'Đã xóa'}</span> },
        { title: 'LOẠI', dataIndex: 'type', render: t => <Tag color={t === 'in' ? 'blue' : 'orange'}>{t === 'in' ? 'Kiểm kê (Tăng)' : 'Báo hủy (Giảm)'}</Tag> },
        { title: 'SỐ LƯỢNG', dataIndex: 'quantity', render: (q, record) => <span className={`font-bold ${record.type === 'in' ? 'text-blue-500' : 'text-orange-500'}`}>{record.type === 'in' ? '+' : '-'}{q}</span> },
        { title: 'LÝ DO', dataIndex: 'reason', render: t => <span>{t}</span> },
        { title: 'NGƯỜI XỬ LÝ', dataIndex: 'adjustedBy', render: u => <span className="text-gray-500">{u?.name || 'Admin'}</span> },
        { title: 'THỜI GIAN', dataIndex: 'createdAt', render: d => <span className="text-gray-500">{new Date(d).toLocaleString('vi-VN')}</span> }
    ];

    const formatCurrency = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString('vi-VN');
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div>

                </div>
                <div className="flex gap-3">
                    {/* Báo Hủy */}
                    <Button
                        icon={<WarningOutlined />}
                        danger
                        onClick={() => navigate('/admin/inventory/adjustment')}
                        className="h-[40px] rounded-xl border-red-200 text-red-500 bg-red-50 hover:bg-red-100"
                    >
                        Báo Hủy / Hư Hỏng
                    </Button>

                    {/* Nhập Hàng */}
                    <Button icon={<TeamOutlined />} onClick={() => navigate('/admin/inventory/suppliers')} className="h-[40px] rounded-xl">Nhà Cung Cấp</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/inventory/create-import')} className="bg-brand-500 h-[40px] px-6 rounded-xl font-bold border-none">Nhập Hàng</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <InventoryStat title="Giá trị kho" value={`${formatCurrency(stats.inventoryValue)} đ`} color="text-brand-500" />
                <InventoryStat title="Phiếu nhập tháng" value={stats.monthImportCount} color="text-navy-700" />
                <InventoryStat title="Chi phí nhập (Tháng)" value={`${formatCurrency(stats.monthImportCost)} đ`} color="text-red-500" />
                <InventoryStat title="NCC thân thiết nhất" value={stats.topSupplierName} color="text-green-500" />
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm">
                <div className="flex gap-4 mb-4">
                    <RangePicker 
                      className="h-[40px] rounded-xl bg-[#F4F7FE] border-none" 
                      onChange={(dates) => setDateRange(dates)}
                      placeholder={['Từ ngày', 'Đến ngày']}
                    />
                </div>
                
                <Tabs defaultActiveKey="imports" items={[
                    {
                        key: 'imports',
                        label: 'Lịch sử Phiếu nhập',
                        children: (
                            <Table 
                              columns={columns} 
                              dataSource={data} 
                              loading={loading}
                              pagination={pagination} 
                              onChange={handleTableChange}
                              className="custom-table-metrix" 
                              locale={{ emptyText: 'Chưa có dữ liệu phiếu nhập' }}
                            />
                        )
                    },
                    {
                        key: 'adjustments',
                        label: 'Lịch sử Kiểm kê / Báo hủy',
                        children: (
                            <Table 
                              columns={adjustmentColumns} 
                              dataSource={adjustments} 
                              loading={loading}
                              pagination={adjustmentPagination} 
                              onChange={handleAdjustmentTableChange}
                              className="custom-table-metrix" 
                              locale={{ emptyText: 'Chưa có dữ liệu kiểm kê/báo hủy' }}
                            />
                        )
                    }
                ]} />
            </div>

            {/* Modal Chi tiết phiếu nhập */}
            <Modal
              title={<span className="text-navy-700 font-bold"><FileTextOutlined className="mr-2"/>Chi tiết phiếu nhập hàng</span>}
              open={isModalOpen}
              onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedRecord(null);
              }}
              footer={[
                  <Button key="print" icon={<PrinterOutlined />}>In phiếu</Button>,
                  <Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>Đóng</Button>
              ]}
              width={800}
              centered
            >
                {fetchingDetail ? (
                    <div className="py-10 text-center">Đang tải chi tiết...</div>
                ) : selectedRecord ? (
                    <div>
                        <Descriptions column={2} bordered size="small" className="mb-4">
                            <Descriptions.Item label="Mã phiếu">{selectedRecord._id}</Descriptions.Item>
                            <Descriptions.Item label="Ngày nhập">{new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
                            <Descriptions.Item label="Nhà cung cấp">{selectedRecord.supplierId?.name}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">{selectedRecord.supplierId?.phone}</Descriptions.Item>
                            <Descriptions.Item label="Người nhập">{selectedRecord.importedBy?.name}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color="green">{selectedRecord.status.toUpperCase()}</Tag>
                            </Descriptions.Item>
                        </Descriptions>
                        
                        <Title level={5} className="!text-navy-700 !mt-4">Danh sách sản phẩm</Title>
                        <Table 
                          dataSource={selectedRecord.items} 
                          columns={detailColumns} 
                          pagination={false} 
                          size="small" 
                          rowKey={(record) => record.productId._id}
                        />
                        
                        <Divider />
                        <div className="flex justify-between items-center px-4">
                            <span className="text-gray-500">Ghi chú: {selectedRecord.notes || 'Không có'}</span>
                            <div className="text-right">
                                <span className="text-gray-500 mr-4">Tổng thanh toán:</span>
                                <span className="text-xl font-bold text-pink-600">
                                    {selectedRecord.totalAmount.toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-10 text-center text-gray-400">Không có dữ liệu hiển thị</div>
                )}
            </Modal>
        </div>
    );
};

export default InventoryPage;