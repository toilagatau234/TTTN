import React, { useState, useEffect } from 'react';
import {
  BarChartOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  WalletOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import MiniStatistics from './components/MiniStatistics';
import ComplexTable from './components/ComplexTable';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Hàm dọn dẹp (Cleanup function)
    return () => clearTimeout(timer);
  }, []);

  // Dữ liệu biểu đồ giả lập
  const chartData = [
    { name: 'T2', revenue: 4000 },
    { name: 'T3', revenue: 3000 },
    { name: 'T4', revenue: 2000 },
    { name: 'T5', revenue: 2780 },
    { name: 'T6', revenue: 1890 },
    { name: 'T7', revenue: 2390 },
    { name: 'CN', revenue: 3490 },
  ];

  // Component Card bao ngoài (Widget)
  const CardBox = ({ children, title, extraClass = '' }) => (
    <div className={`bg-white p-5 rounded-[20px] shadow-sm ${extraClass}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xl font-bold text-navy-700">{title}</h4>
          <button className="bg-[#F4F7FE] rounded-full p-2 hover:bg-gray-100 transition-colors">
            <CalendarOutlined className="text-brand-500" />
          </button>
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-5 mt-3">

      {/* --- HÀNG 1: THỐNG KÊ (Mini Stats) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MiniStatistics
          loading={loading}
          icon={<BarChartOutlined />}
          title="Doanh thu"
          value="350.400"
          prefix="₫"
          growth={12.5}
        />
        <MiniStatistics
          loading={loading}
          icon={<ShoppingCartOutlined />}
          title="Đơn hàng"
          value="64"
          growth={-2.4}
        />
        <MiniStatistics
          loading={loading}
          icon={<UsergroupAddOutlined />}
          title="Khách hàng"
          value="1,203"
          growth={8.2}
        />
        <MiniStatistics
          loading={loading}
          icon={<WalletOutlined />}
          title="Số dư ví"
          value="12M"
          prefix="₫"
        />
      </div>

      {/* --- HÀNG 2: BIỂU ĐỒ DOANH THU & WIDGET --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Biểu đồ cột (Chiếm 2 phần) */}
        <CardBox title="Doanh thu tuần này" extraClass="lg:col-span-2 min-h-[350px]">
          {/* SỬA LỖI 2: Thêm style cứng minHeight để tránh lỗi width(-1) */}
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A3AED0', fontSize: 12 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#4318FF"
                  radius={[10, 10, 10, 10]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBox>

        {/* Các Widget bên phải (Chiếm 1 phần) */}
        <div className="flex flex-col gap-5">
          <CardBox title="Loại hoa bán chạy" extraClass="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full border-4 border-brand-500 flex items-center justify-center text-xs font-bold text-navy-700">
                65%
              </div>
              <div>
                <h5 className="font-bold text-navy-700">Hoa Hồng Đỏ</h5>
                <p className="text-xs text-gray-400">Doanh số cao nhất</p>
              </div>
            </div>
          </CardBox>

          <CardBox title="Lịch sự kiện" extraClass="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 py-4">
              <div className="bg-green-100 p-3 rounded-xl text-green-600 font-bold text-center leading-tight">
                24<br /><span className="text-xs font-normal">Jan</span>
              </div>
              <div>
                <h5 className="font-bold text-navy-700">Giao hoa hội nghị</h5>
                <p className="text-xs text-gray-400">10:00 AM - Quận 1</p>
              </div>
            </div>
          </CardBox>
        </div>
      </div>

      {/* --- HÀNG 3: BẢNG SẢN PHẨM (Top Products) --- */}
      <CardBox
        title="Sản phẩm nổi bật"
        extraClass="overflow-hidden"
      >
        <ComplexTable />
      </CardBox>

    </div>
  );
};

export default Dashboard;