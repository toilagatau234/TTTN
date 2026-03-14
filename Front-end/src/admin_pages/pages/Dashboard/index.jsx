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

      {/* --- THỐNG KÊ --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MiniStatistics
          loading={loading}
          icon={<BarChartOutlined />}
          title="Doanh thu"
          value={statsData.totalRevenue.toLocaleString()}
          prefix="₫ "
          growth={0}
        />
        <MiniStatistics
          loading={loading}
          icon={<ShoppingCartOutlined />}
          title="Đơn hàng"
          value={statsData.totalOrders.toLocaleString()}
          growth={0}
        />
        <MiniStatistics
          loading={loading}
          icon={<UsergroupAddOutlined />}
          title="Khách hàng"
          value={statsData.totalUsers.toLocaleString()}
          growth={0}
        />
        <MiniStatistics
          loading={loading}
          icon={<WalletOutlined />}
          title="Hoa đang bán"
          value={statsData.totalProducts.toLocaleString()}
        />
      </div>

      {/* --- BIỂU ĐỒ DOANH THU & WIDGET --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Biểu đồ cột */}
        <CardBox title="Doanh thu tuần này" extraClass="lg:col-span-2 min-h-[350px]">
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
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

        {/* Các Widget bên phải */}
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

      {/* --- BẢNG SẢN PHẨM (Top Products) --- */}
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