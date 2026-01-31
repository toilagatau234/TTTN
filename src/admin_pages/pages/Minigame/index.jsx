// src/admin_pages/pages/Minigame/index.jsx
import React, { useState } from 'react';
import { Table, Button, Tag, Avatar, Input, Select, Dropdown, Menu, message } from 'antd';
import { 
  PlusOutlined, SearchOutlined, MoreOutlined, 
  EditOutlined, DeleteOutlined, GiftOutlined,
  PlayCircleOutlined, StopOutlined, RocketOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateGameModal from './components/CreateGameModal';

const { Option } = Select;

// Widget thống kê tổng quan
const StatBox = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-[20px] shadow-sm flex items-center justify-between">
    <div>
       <p className="text-gray-400 text-xs font-bold uppercase mb-1">{title}</p>
       <h3 className="text-2xl font-bold text-navy-700">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>{icon}</div>
  </div>
);

const MinigameListPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dữ liệu danh sách các game
  const [games, setGames] = useState([
    {
      key: '1', id: 'GAME-101', name: 'Vòng Quay May Mắn Tết 2026', type: 'Wheel', 
      status: 'Active', participants: 1205, startDate: '01/01/2026', endDate: '30/01/2026',
      image: 'https://img.freepik.com/free-vector/fortune-wheel-vector-illustration_1284-11915.jpg'
    },
    {
      key: '2', id: 'GAME-102', name: 'Lật Thẻ Tìm Valentine', type: 'Flip', 
      status: 'Pending', participants: 0, startDate: '10/02/2026', endDate: '15/02/2026',
      image: 'https://img.freepik.com/free-vector/memory-game-cards-vector-illustration_1284-42862.jpg'
    },
    {
      key: '3', id: 'GAME-103', name: 'Săn Sale 8/3', type: 'Gacha', 
      status: 'Closed', participants: 340, startDate: '01/03/2025', endDate: '08/03/2025',
      image: 'https://img.freepik.com/free-vector/gift-box-vector-illustration_1284-10892.jpg'
    },
  ]);

  const handleCreate = (newGame) => {
    setGames([newGame, ...games]);
    setIsModalOpen(false);
  };

  const handleDelete = (key) => {
    setGames(games.filter(g => g.key !== key));
    message.success('Đã xóa chiến dịch game');
  };

  const columns = [
    {
      title: 'CHIẾN DỊCH GAME',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/minigames/${record.id}`)}>
          <img src={record.image} alt="game" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
          <div>
            <h5 className="font-bold text-navy-700 text-sm m-0 hover:text-brand-500 transition-colors">{text}</h5>
            <span className="text-gray-400 text-xs">{record.type}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'THỜI GIAN',
      key: 'time',
      render: (_, record) => (
        <div className="text-xs text-gray-500 font-medium">
          <div>Bắt đầu: {record.startDate}</div>
          <div>Kết thúc: {record.endDate}</div>
        </div>
      )
    },
    {
      title: 'NGƯỜI CHƠI',
      dataIndex: 'participants',
      key: 'participants',
      render: (val) => <span className="font-bold text-navy-700">{val.toLocaleString()}</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'Active' ? 'green' : (status === 'Pending' ? 'orange' : 'default');
        let label = status === 'Active' ? 'Đang chạy' : (status === 'Pending' ? 'Sắp tới' : 'Đã đóng');
        return <Tag color={color} className="font-bold border-0 py-1 px-2 rounded-lg">{label}</Tag>;
      }
    },
    {
      title: 'HÀNH ĐỘNG',
      key: 'action',
      render: (_, record) => (
        <Dropdown 
          overlay={
            <Menu items={[
              { key: '1', label: 'Cấu hình chi tiết', icon: <GiftOutlined />, onClick: () => navigate(`/admin/minigames/${record.id}`) },
              { key: '2', label: 'Sửa thông tin', icon: <EditOutlined /> },
              { key: '3', label: 'Xóa chiến dịch', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.key) },
            ]} />
          } 
        >
          <Button type="text" icon={<MoreOutlined className="text-gray-400 text-lg" />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-navy-700">Danh sách Minigame</h2>
           <p className="text-gray-500 text-sm">Quản lý các chương trình khuyến mãi game</p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-500 h-10 px-6 rounded-xl font-bold shadow-brand-500/50 border-none hover:bg-brand-600"
        >
          Tạo Chiến Dịch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
         <StatBox title="Đang diễn ra" value={games.filter(g => g.status === 'Active').length} icon={<RocketOutlined />} color="bg-green-50 text-green-500" />
         <StatBox title="Tổng người chơi" value="1,545" icon={<PlayCircleOutlined />} color="bg-light-primary text-brand-500" />
         <StatBox title="Đã kết thúc" value={games.filter(g => g.status === 'Closed').length} icon={<StopOutlined />} color="bg-gray-100 text-gray-500" />
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
         <div className="flex justify-between mb-4">
            <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm tên chiến dịch..." className="w-[300px] rounded-xl h-[40px] border-none bg-[#F4F7FE]" />
            <Select defaultValue="all" className="w-[150px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl"><Option value="all">Tất cả loại</Option></Select>
         </div>
         <Table columns={columns} dataSource={games} pagination={{ pageSize: 5 }} className="custom-table-metrix" />
      </div>

      <CreateGameModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default MinigameListPage;