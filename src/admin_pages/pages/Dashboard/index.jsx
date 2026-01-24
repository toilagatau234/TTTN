// src/admin_pages/pages/Dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChartOutlined, ShoppingCartOutlined, UsergroupAddOutlined, WalletOutlined, CalendarOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import MiniStatistics from './components/MiniStatistics';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => setTimeout(() => setLoading(false), 1000), []);

  // Dữ liệu giả cho biểu đồ
  const chartData = [{ name: 'T2', rev: 4000 }, { name: 'T3', rev: 3000 }, { name: 'T4', rev: 2000 }, { name: 'T5', rev: 2780 }, { name: 'T6', rev: 1890 }, { name: 'T7', rev: 2390 }, { name: 'CN', rev: 3490 }];

  // Component Widget bao ngoài (Card trắng bo góc)
  const CardBox = ({ children, title, extraClass = '' }) => (
    <div className={`bg-white p-5 rounded-[20px] shadow-sm ${extraClass}`}>
      {title && <h4 className="text-lg font-bold text-navy-700 mb-4">{title}</h4>}
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* --- HÀNG 1: MINI STATS (Grid 6 cột chuẩn Metrix) --- */}
      {/* Trên màn hình lớn (2xl), chia 6 cột. Màn hình nhỏ hơn chia ít cột hơn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-5">
        {/* Ô đầu tiên thường lớn hơn để tạo điểm nhấn (chiếm 2 cột trên màn hình lớn) */}
        <div className="md:col-span-2 2xl:col-span-2 bg-brand-500 p-5 rounded-[20px] text-white flex flex-col justify-between relative overflow-hidden shadow-brand-500/50">
             <div>
                 <h4 className="text-lg font-bold opacity-90">Doanh thu hôm nay</h4>
                 <h2 className="text-4xl font-bold mt-2">5.400.000 ₫</h2>
             </div>
             <p className="text-sm opacity-80 mt-4">Tốt hơn hôm qua 15%</p>
             <WalletOutlined className="absolute -right-5 -bottom-5 text-[150px] opacity-20" />
        </div>
        
        {/* Các ô thống kê nhỏ */}
        <MiniStatistics loading={loading} icon={<ShoppingCartOutlined />} title="Đơn chờ xử lý" value="12" />
        <MiniStatistics loading={loading} icon={<UsergroupAddOutlined />} title="Khách mới (Tuần)" value="85" growth={8.2} />
        <MiniStatistics loading={loading} icon={<BarChartOutlined />} title="Tổng doanh thu (Tháng)" value="350M" prefix="₫" growth={12.5} />
        <MiniStatistics loading={loading} icon={<WalletOutlined />} title="Chi phí quảng cáo" value="45M" prefix="₫" growth={-2.4} />
      </div>

      {/* --- HÀNG 2: CÁC BIỂU ĐỒ CHÍNH (Chia 3 phần: 2 phần trái, 1 phần phải) --- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        
        {/* Cột TRÁI (Lớn - chiếm 2/3): Biểu đồ doanh thu tuần */}
        <CardBox title="Doanh thu tuần này" extraClass="lg:col-span-2 h-[400px]">
           <div className="flex justify-end mb-4">
                <button className="bg-light-primary text-brand-500 p-2 rounded-lg hover:bg-gray-100"><CalendarOutlined /></button>
           </div>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 12}} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'}} />
                 <Bar dataKey="rev" fill="#4318FF" radius={[20, 20, 20, 20]} barSize={24} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </CardBox>

        {/* Cột PHẢI (Nhỏ - chiếm 1/3): Chứa các widget xếp chồng */}
        <div className="flex flex-col gap-5">
            {/* Placeholder: Biểu đồ tròn (Pie Chart) */}
            <CardBox title="Tỷ lệ loại hoa bán ra" extraClass="h-[240px] flex items-center justify-center bg-gray-50 border-dashed border-2 border-gray-200">
                <span className="text-gray-400 font-medium">[Vị trí Pie Chart]</span>
            </CardBox>
            
            {/* Placeholder: Lịch hoặc danh sách nhỏ */}
            <CardBox title="Lịch giao hàng sắp tới" extraClass="h-[240px] flex items-center justify-center bg-gray-50 border-dashed border-2 border-gray-200">
                 <span className="text-gray-400 font-medium">[Vị trí Mini Calendar]</span>
            </CardBox>
        </div>
      </div>

      {/* --- HÀNG 3: BẢNG DỮ LIỆU PHỨC TẠP (Full width) --- */}
      <CardBox title="Đơn hàng cần xử lý gấp" extraClass="min-h-[300px] flex items-center justify-center bg-gray-50 border-dashed border-2 border-gray-200">
           <span className="text-gray-400 font-medium text-lg">[Vị trí Complex Table - Sẽ làm sau]</span>
      </CardBox>

    </div>
  );
};

export default Dashboard;