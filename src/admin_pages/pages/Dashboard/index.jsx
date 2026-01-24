import React, { useState, useEffect } from 'react';
import { 
  BarChartOutlined, 
  ShoppingCartOutlined, 
  UsergroupAddOutlined, 
  WalletOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import MiniStatistics from './components/MiniStatistics';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  // Giả lập việc tải dữ liệu từ API
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Sau 2 giây sẽ hiện dữ liệu
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mt-3">
      {/* --- Hàng 1: Các thẻ thống kê (Mini Stats) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        
        {/* Thẻ 1: Doanh thu tháng này */}
        <MiniStatistics
          loading={loading}
          icon={<BarChartOutlined />}
          title="Doanh thu (Tháng)"
          value="350.400"
          prefix="₫"
          growth={12.5} // Tăng trưởng 12.5%
        />

        {/* Thẻ 2: Tổng đơn hàng */}
        <MiniStatistics
          loading={loading}
          icon={<ShoppingCartOutlined />}
          title="Đơn hàng mới"
          value="64"
          growth={-2.4} // Giảm 2.4%
        />

        {/* Thẻ 3: Khách hàng mới */}
        <MiniStatistics
          loading={loading}
          icon={<UsergroupAddOutlined />}
          title="Khách hàng mới"
          value="1,203"
          growth={8.2}
        />

        {/* Thẻ 4: Số dư ví (Ví dụ VNPAY/Momo của Shop) */}
        <MiniStatistics
          loading={loading}
          icon={<WalletOutlined />}
          title="Số dư hiện tại"
          value="12.000.000"
          prefix="₫"
        />
      </div>

      {/* --- Hàng 2: Biểu đồ & Bảng (Sẽ làm ở bước sau) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Placeholder cho Biểu đồ doanh thu */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-navy-700">Tổng quan doanh thu</h3>
             <button className="bg-light-primary text-brand-500 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                <CalendarOutlined /> Tháng này
             </button>
          </div>
          
          {loading ? (
             <div className="h-full flex items-center justify-center text-gray-400">Đang tải biểu đồ...</div>
          ) : (
             <div className="h-[250px] bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
               [Vị trí Biểu đồ Cột - Weekly Revenue]
             </div>
          )}
        </div>

        {/* Placeholder cho Danh sách đơn mới */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm min-h-[300px]">
          <h3 className="text-lg font-bold text-navy-700 mb-4">Đơn hàng gần đây</h3>
           {loading ? (
             <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
             </div>
          ) : (
             <div className="h-[250px] bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
               [Vị trí Bảng Đơn Hàng - CheckTable]
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;