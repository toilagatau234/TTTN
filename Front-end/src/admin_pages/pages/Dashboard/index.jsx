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
import statsService from '../../../services/statsService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [overviewRes, revenueRes] = await Promise.all([
          statsService.getOverview(),
          statsService.getRevenueStats({ period: 'week' })  // Lấy danh thu tuần này
        ]);

        if (overviewRes.success) {
          setStatsData({
            totalOrders: overviewRes.data.totalOrders,
            totalRevenue: overviewRes.data.totalRevenue,
            totalUsers: overviewRes.data.totalUsers,
            totalProducts: overviewRes.data.totalProducts,
          });
        }

        if (revenueRes.success) {
          // Format data for Recharts (e.g., date: '2023-10-01' -> name: '01/10')
          const formattedChart = revenueRes.data.map(item => {
            const dateObj = new Date(item._id);
            const dayName = dateObj.toLocaleDateString('vi-VN', { weekday: 'short' }); // T2, T3...
            return {
              name: dayName,
              revenue: item.revenue
            };
          });
          setChartData(formattedChart);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const CardBox = ({ children, title, extraClass = '' }) => (
    <div className={`bg-white p-6 rounded-[24px] shadow-premium border border-white/50 relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-500 ${extraClass}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      {title && (
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h4 className="text-xl font-black text-[#2B3674] tracking-tight m-0">{title}</h4>
          <button className="bg-[#F4F7FE] rounded-2xl p-2.5 hover:bg-blue-50 text-blue-500 transition-all border border-transparent hover:border-blue-100 active:scale-95">
            <CalendarOutlined />
          </button>
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 mt-2">

      {/* --- THỐNG KÊ --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniStatistics
          loading={loading}
          icon={<BarChartOutlined />}
          title="Doanh thu"
          value={statsData.totalRevenue.toLocaleString()}
          prefix="₫ "
          growth={12.5}
        />
        <MiniStatistics
          loading={loading}
          icon={<ShoppingCartOutlined />}
          title="Đơn hàng"
          value={statsData.totalOrders.toLocaleString()}
          growth={8.2}
        />
        <MiniStatistics
          loading={loading}
          icon={<UsergroupAddOutlined />}
          title="Khách hàng"
          value={statsData.totalUsers.toLocaleString()}
          growth={-2.4}
        />
        <MiniStatistics
          loading={loading}
          icon={<WalletOutlined />}
          title="Hoa đang bán"
          value={statsData.totalProducts.toLocaleString()}
          growth={0}
        />
      </div>

      {/* --- BIỂU ĐỒ DOANH THU & WIDGET --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Biểu đồ cột */}
        <CardBox title="Biên độ doanh thu" extraClass="lg:col-span-2">
          <div className="h-[320px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4318FF" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#4318FF" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A3AED0', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: '#F4F7FE', radius: 10 }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 800, color: '#2B3674' }}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#barGradient)"
                  radius={[6, 6, 6, 6]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBox>

        {/* Các Widget bên phải */}
        <div className="flex flex-col gap-6">
          <CardBox title="Tiêu điểm" extraClass="flex-1">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full border-[6px] border-[#F4F7FE] flex items-center justify-center">
                  <span className="text-2xl font-black text-[#2B3674]">65%</span>
                </div>
                <svg className="absolute top-0 left-0 w-24 h-24 -rotate-90">
                  <circle 
                    cx="48" cy="48" r="45" 
                    fill="none" stroke="#4318FF" strokeWidth="6" 
                    strokeDasharray="282" strokeDashoffset={282 * 0.35}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <h5 className="font-black text-[#2B3674] text-lg m-0">Hoa Hồng Đỏ</h5>
                <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Bestseller vinh danh</p>
                <div className="mt-4 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black inline-block">
                  +12% so với tháng trước
                </div>
              </div>
            </div>
          </CardBox>

          <CardBox title="Lịch sự kiện" extraClass="flex-1">
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#F4F7FE]/50 hover:bg-[#F4F7FE] transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center leading-none border border-gray-50 group-hover:border-blue-200 transition-all">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Mar</span>
                  <span className="text-lg font-black text-blue-600">28</span>
                </div>
                <div>
                  <h5 className="font-bold text-[#2B3674] text-sm m-0">Giao hoa hội nghị</h5>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">10:00 AM • Khách sạn Rex</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#F4F7FE]/50 hover:bg-[#F4F7FE] transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center leading-none border border-gray-50 group-hover:border-blue-200 transition-all">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Apr</span>
                  <span className="text-lg font-black text-blue-600">02</span>
                </div>
                <div>
                  <h5 className="font-bold text-[#2B3674] text-sm m-0">Khai trương Spa</h5>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">02:30 PM • Quận 3, HCM</p>
                </div>
              </div>
            </div>
          </CardBox>
        </div>
      </div>

      {/* --- BẢNG SẢN PHẨM (Top Products) --- */}
      <CardBox
        title="Top Sản phẩm thịnh hành"
        extraClass="overflow-hidden mb-10"
      >
        <div className="mt-4">
          <ComplexTable />
        </div>
      </CardBox>

    </div>
  );
};

export default Dashboard;