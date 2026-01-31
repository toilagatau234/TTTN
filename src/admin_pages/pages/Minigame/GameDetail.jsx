import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Table, Tag, InputNumber, Switch, Breadcrumb, Tabs, message, Avatar, DatePicker } from 'antd';
import { 
  ArrowLeftOutlined, SaveOutlined, SettingOutlined, 
  HistoryOutlined, UserOutlined, TrophyOutlined 
} from '@ant-design/icons';

const { RangePicker } = DatePicker;

const GameDetail = () => {
  const { id } = useParams(); // Lấy ID game từ URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Giả lập dữ liệu chi tiết của game này
  const [gameInfo, setGameInfo] = useState({
    name: 'Vòng Quay May Mắn Tết 2026',
    status: true, // Active
    type: 'Lucky Wheel',
  });

  // Cấu hình phần thưởng (Riêng cho game này)
  const [rewards, setRewards] = useState([
    { key: '1', name: 'Voucher 10%', type: 'Common', probability: 50, quantity: 1000 },
    { key: '2', name: 'Voucher 50%', type: 'Rare', probability: 10, quantity: 50 },
    { key: '3', name: 'Iphone 15', type: 'Legendary', probability: 1, quantity: 2 },
    { key: '4', name: 'Chúc may mắn', type: 'None', probability: 39, quantity: 9999 },
  ]);

  const handleSave = () => {
    setLoading(true);
    const total = rewards.reduce((sum, item) => sum + item.probability, 0);
    setTimeout(() => {
      setLoading(false);
      if (total !== 100) message.warning(`Tổng tỉ lệ là ${total}%. Cần chỉnh về 100%!`);
      else message.success('Đã lưu cấu hình chiến dịch!');
    }, 800);
  };

  // --- CỘT BẢNG CẤU HÌNH ---
  const rewardColumns = [
    { title: 'Phần thưởng', dataIndex: 'name', key: 'name', render: t => <span className="font-bold text-navy-700">{t}</span> },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: t => <Tag color={t === 'Legendary' ? 'purple' : 'blue'}>{t}</Tag> },
    { title: 'Tỉ lệ (%)', dataIndex: 'probability', key: 'prob', render: v => <InputNumber min={0} max={100} defaultValue={v} formatter={v => `${v}%`} className="rounded-lg font-bold" /> },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'qty', render: v => <InputNumber min={0} defaultValue={v} className="rounded-lg" /> },
  ];

  // --- TAB LỊCH SỬ ---
  const historyColumns = [
    { title: 'Người chơi', dataIndex: 'user', key: 'user', render: (t) => <span className="font-medium text-navy-700"><UserOutlined className="mr-2"/>{t}</span> },
    { title: 'Phần thưởng', dataIndex: 'reward', key: 'reward', render: t => <span className="text-brand-500 font-bold">{t}</span> },
    { title: 'Thời gian', dataIndex: 'time', key: 'time', render: t => <span className="text-gray-400 text-sm">{t}</span> },
  ];
  const historyData = [
    { key: '1', user: 'Nguyen Van A', reward: 'Voucher 10%', time: '10:30 24/01/2026' },
    { key: '2', user: 'Tran Thi B', reward: 'Iphone 15', time: '09:15 24/01/2026' },
  ];

  return (
    <div className="w-full">
      {/* HEADER & NAV */}
      <div className="flex flex-col gap-1 mb-6">
        <Breadcrumb>
          <Breadcrumb.Item className="cursor-pointer hover:text-brand-500" onClick={() => navigate('/admin/minigames')}>Minigame</Breadcrumb.Item>
          <Breadcrumb.Item>{gameInfo.name}</Breadcrumb.Item>
        </Breadcrumb>
        <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-4">
                <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate('/admin/minigames')} />
                <h2 className="text-2xl font-bold text-navy-700 m-0">{gameInfo.name}</h2>
                <Tag color="green">Đang chạy</Tag>
            </div>
            <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave} className="bg-brand-500 h-10 px-6 rounded-xl border-none font-bold">Lưu Thay Đổi</Button>
        </div>
      </div>

      {/* MAIN CONTENT - TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* CỘT TRÁI: CẤU HÌNH & LỊCH SỬ */}
         <div className="lg:col-span-2">
            <Tabs defaultActiveKey="1" items={[
               {
                 key: '1',
                 label: <span><SettingOutlined /> Cấu hình Quà tặng</span>,
                 children: (
                   <Card className="rounded-[20px] shadow-sm border-none">
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-xl mb-4 text-sm">
                        Đang cấu hình cho: <strong>{gameInfo.name} ({gameInfo.type})</strong>. Tổng tỉ lệ phải là 100%.
                      </div>
                      <Table columns={rewardColumns} dataSource={rewards} pagination={false} className="custom-table-metrix" />
                   </Card>
                 )
               },
               {
                 key: '2',
                 label: <span><HistoryOutlined /> Lịch sử Trúng thưởng</span>,
                 children: (
                   <Card className="rounded-[20px] shadow-sm border-none">
                      <Table columns={historyColumns} dataSource={historyData} className="custom-table-metrix" />
                   </Card>
                 )
               }
            ]} />
         </div>

         {/* CỘT PHẢI: CÀI ĐẶT CHUNG */}
         <div>
            <Card title={<span className="font-bold text-navy-700">Thiết lập chung</span>} className="rounded-[20px] shadow-sm border-none mb-6">
               <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-600">Kích hoạt Game</span>
                  <Switch checked={gameInfo.status} />
               </div>
               <div className="mb-4">
                  <p className="text-gray-500 font-medium mb-2">Thời gian áp dụng</p>
                  <RangePicker className="w-full rounded-xl h-[40px] bg-[#F4F7FE] border-none" />
               </div>
               <div className="mb-4">
                  <p className="text-gray-500 font-medium mb-2">Giới hạn lượt chơi/ngày</p>
                  <InputNumber defaultValue={3} className="w-full rounded-xl h-[40px] bg-[#F4F7FE] border-none flex items-center" />
               </div>
            </Card>

            <Card title="Preview" className="rounded-[20px] shadow-sm border-none">
               <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-dashed border-2">
                  <span className="text-gray-400 text-xs">Godot Game Preview Area</span>
               </div>
            </Card>
         </div>

      </div>
    </div>
  );
};

export default GameDetail;