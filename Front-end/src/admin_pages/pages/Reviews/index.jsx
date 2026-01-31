import React, { useState } from 'react';
import { Table, Rate, Avatar, Button, Tag, Input, Select, Dropdown, Menu, Modal, message } from 'antd';
import { 
  SearchOutlined, FilterOutlined, MoreOutlined, 
  MessageOutlined, EyeInvisibleOutlined, DeleteOutlined,
  CheckCircleOutlined, StarFilled
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// Widget Thống kê
const ReviewStat = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-[20px] shadow-sm flex items-center justify-between">
     <div>
        <p className="text-gray-400 text-xs font-bold uppercase mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-navy-700">{value}</h3>
     </div>
     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>
        {icon}
     </div>
  </div>
);

const ReviewsPage = () => {
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);

  const [data, setData] = useState([
    {
      key: '1', id: 1, 
      user: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?img=1',
      product: 'Bó Hoa Hồng Đỏ Valentine', productImage: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=100&q=80',
      rating: 5, comment: 'Hoa rất tươi, gói đẹp, giao hàng nhanh. Sẽ ủng hộ shop tiếp!',
      date: '10:30 24/01/2026', status: 'Approved', reply: ''
    },
    {
      key: '2', id: 2, 
      user: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?img=5',
      product: 'Lan Hồ Điệp Vàng', productImage: 'https://images.unsplash.com/photo-1566929369-1c255c5e0682?auto=format&fit=crop&w=100&q=80',
      rating: 4, comment: 'Hoa đẹp nhưng giao hơi trễ một chút.',
      date: '09:15 24/01/2026', status: 'Pending', reply: ''
    },
    {
      key: '3', id: 3, 
      user: 'Lê Hoàng C', avatar: 'https://i.pravatar.cc/150?img=3',
      product: 'Hoa Cẩm Tú Cầu', productImage: 'https://images.unsplash.com/photo-1588825838638-349f291350a4?auto=format&fit=crop&w=100&q=80',
      rating: 1, comment: 'Hoa bị dập nát khi nhận. Yêu cầu hoàn tiền!',
      date: '08:00 23/01/2026', status: 'Spam', reply: ''
    },
  ]);

  const handleOpenReply = (record) => {
    setCurrentReview(record);
    setReplyModalOpen(true);
  };

  const handleReplySubmit = () => {
    message.success('Đã gửi phản hồi thành công!');
    setReplyModalOpen(false);
  };

  const columns = [
    {
      title: 'SẢN PHẨM',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
           <img src={record.productImage} alt="prod" className="w-10 h-10 rounded-lg object-cover" />
           <span className="font-bold text-navy-700 text-sm line-clamp-1">{record.product}</span>
        </div>
      )
    },
    {
      title: 'KHÁCH HÀNG',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2">
           <Avatar src={record.avatar} size="small" />
           <div>
              <div className="font-bold text-sm text-navy-700">{record.user}</div>
              <div className="text-xs text-gray-400">{record.date}</div>
           </div>
        </div>
      )
    },
    {
      title: 'ĐÁNH GIÁ',
      width: 300,
      render: (_, record) => (
        <div>
           <Rate disabled defaultValue={record.rating} className="text-sm text-yellow-500 mb-1" />
           <p className="text-gray-600 text-sm">{record.comment}</p>
           {record.reply && <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-500 border-l-2 border-brand-500">Shop: {record.reply}</div>}
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      render: (status) => {
         let color = status === 'Approved' ? 'green' : (status === 'Pending' ? 'orange' : 'red');
         return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'THAO TÁC',
      render: (_, record) => (
        <div className="flex gap-2">
           <Button icon={<MessageOutlined />} size="small" onClick={() => handleOpenReply(record)} className="text-blue-500 border-blue-100 bg-blue-50" />
           <Button icon={<EyeInvisibleOutlined />} size="small" className="text-orange-500 border-orange-100 bg-orange-50" />
           <Button icon={<DeleteOutlined />} size="small" danger className="bg-red-50 border-red-100" />
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
         <ReviewStat title="Tổng đánh giá" value="1,204" icon={<MessageOutlined />} color="bg-light-primary text-brand-500" />
         <ReviewStat title="Đánh giá 5 sao" value="980" icon={<StarFilled />} color="bg-yellow-50 text-yellow-500" />
         <ReviewStat title="Chờ duyệt" value="15" icon={<FilterOutlined />} color="bg-orange-50 text-orange-500" />
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
         <div className="flex justify-between mb-4">
            <div className="flex gap-3">
               <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm theo tên SP, Khách hàng..." className="w-[300px] rounded-xl bg-[#F4F7FE] border-none" />
               <Select defaultValue="all" className="w-[150px] custom-select-metrix bg-[#F4F7FE] rounded-xl"><Option value="all">Tất cả sao</Option><Option value="5">5 Sao</Option></Select>
            </div>
         </div>
         <Table columns={columns} dataSource={data} pagination={{ pageSize: 5 }} className="custom-table-metrix" />
      </div>

      {/* Modal Reply */}
      <Modal
        title="Phản hồi đánh giá"
        open={replyModalOpen}
        onOk={handleReplySubmit}
        onCancel={() => setReplyModalOpen(false)}
        okText="Gửi phản hồi"
        cancelText="Hủy"
        centered
      >
        {currentReview && (
          <div>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
               <div className="font-bold text-navy-700 mb-1">{currentReview.user} ({currentReview.rating} sao)</div>
               <div className="text-gray-600 italic">"{currentReview.comment}"</div>
            </div>
            <p className="mb-2 font-medium">Nội dung trả lời:</p>
            <TextArea rows={4} placeholder="Nhập câu trả lời của shop..." />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;