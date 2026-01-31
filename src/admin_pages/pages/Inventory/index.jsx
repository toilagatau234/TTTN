import React, { useState } from 'react';
import { Table, Button, Input, Select, Tag, DatePicker, Dropdown, Menu, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, FileTextOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;

// Widget Thống kê
const InventoryStat = ({ title, value, color }) => (
    <div className="bg-white p-5 rounded-[20px] shadow-sm">
        <p className="text-gray-400 text-xs font-bold uppercase mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
    </div>
);

const InventoryPage = () => {
    const navigate = useNavigate();

    const [data] = useState([
        { key: '1', id: 'IMP-001', supplier: 'Vườn Hoa Đà Lạt Hasfarm', date: '30/01/2026', total: '15,500,000 đ', status: 'Completed', creator: 'Admin' },
        { key: '2', id: 'IMP-002', supplier: 'Hoa Nhập Khẩu Hà Lan', date: '28/01/2026', total: '42,000,000 đ', status: 'Completed', creator: 'Admin' },
        { key: '3', id: 'IMP-003', supplier: 'Chợ Hoa Hồ Thị Kỷ', date: '25/01/2026', total: '5,200,000 đ', status: 'Cancelled', creator: 'Staff' },
    ]);

    const columns = [
        { title: 'MÃ PHIẾU', dataIndex: 'id', render: t => <span className="font-bold text-brand-500 cursor-pointer">{t}</span> },
        { title: 'NHÀ CUNG CẤP', dataIndex: 'supplier', render: t => <span className="font-bold text-navy-700">{t}</span> },
        { title: 'NGÀY NHẬP', dataIndex: 'date', render: t => <span className="text-gray-500">{t}</span> },
        { title: 'TỔNG TIỀN', dataIndex: 'total', render: t => <span className="font-bold text-navy-700">{t}</span> },
        {
            title: 'TRẠNG THÁI', dataIndex: 'status',
            render: s => <Tag color={s === 'Completed' ? 'green' : 'red'}>{s === 'Completed' ? 'Đã nhập kho' : 'Đã hủy'}</Tag>
        },
        {
            title: 'THAO TÁC',
            render: () => (
                <Button icon={<EyeOutlined />} size="small" className="border-gray-200 text-gray-500">Chi tiết</Button>
            )
        }
    ];

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
                <InventoryStat title="Giá trị kho" value="125.4M" color="text-brand-500" />
                <InventoryStat title="Phiếu nhập tháng" value="12" color="text-navy-700" />
                <InventoryStat title="Chi phí nhập (Tháng)" value="45.2M" color="text-red-500" />
                <InventoryStat title="NCC thân thiết" value="5" color="text-green-500" />
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm">
                <div className="flex gap-4 mb-4">
                    <Input prefix={<SearchOutlined />} placeholder="Tìm mã phiếu..." className="w-[200px] h-[40px] rounded-xl bg-[#F4F7FE] border-none" />
                    <RangePicker className="h-[40px] rounded-xl bg-[#F4F7FE] border-none" />
                </div>
                <Table columns={columns} dataSource={data} pagination={{ pageSize: 5 }} className="custom-table-metrix" />
            </div>
        </div>
    );
};

export default InventoryPage;