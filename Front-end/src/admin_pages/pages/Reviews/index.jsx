import React, { useState } from 'react';
import { Table, Rate, Avatar, Button, Tag, Input, Select, Dropdown, Menu, Modal, message } from 'antd';
import { 
  SearchOutlined, FilterOutlined, MoreOutlined, 
  MessageOutlined, EyeInvisibleOutlined, DeleteOutlined,
  CheckCircleOutlined, StarFilled, EyeOutlined
} from '@ant-design/icons';
import reviewService from '../../../services/reviewService';

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
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ isApproved: undefined, rating: undefined, search: '' });
  
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async (page = 1, pageSize = 10, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...currentFilters
      };
      const res = await reviewService.getAllReviews(params);
      if (res.success) {
        setData(res.data.map(item => ({ ...item, key: item._id })));
        setPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total
        });
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReviews();
  }, []);

  const handleTableChange = (pag) => {
    fetchReviews(pag.current, pag.pageSize);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
    setFilters(newFilters);
    fetchReviews(1, pagination.pageSize, newFilters);
  };

  const handleToggleApprove = async (id) => {
    try {
      const res = await reviewService.toggleApprove(id);
      if (res.success) {
        message.success(res.message);
        fetchReviews(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await reviewService.deleteReview(id);
          if (res.success) {
            message.success("Đã xóa đánh giá");
            fetchReviews(pagination.current, pagination.pageSize);
          }
        } catch (error) {
          message.error("Lỗi khi xóa đánh giá");
        }
      }
    });
  };

  const handleOpenReply = (record) => {
    setCurrentReview(record);
    setReplyText(record.reply || '');
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      message.warning("Vui lòng nhập nội dung phản hồi");
      return;
    }
    
    setLoading(true);
    try {
      const res = await reviewService.replyReview(currentReview._id, replyText);
      if (res.success) {
        message.success('Đã gửi phản hồi thành công!');
        setReplyModalOpen(false);
        fetchReviews(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      message.error("Lỗi khi gửi phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'SẢN PHẨM',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3">
           <img src={record.product?.images?.[0]?.url} alt="prod" className="w-10 h-10 rounded-lg object-cover" />
           <span className="font-bold text-navy-700 text-sm line-clamp-1">{record.product?.name}</span>
        </div>
      )
    },
    {
      title: 'KHÁCH HÀNG',
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-2">
           <Avatar src={record.user?.avatar} size="small" />
           <div>
              <div className="font-bold text-sm text-navy-700">{record.user?.name}</div>
              <div className="text-[10px] text-gray-400">{new Date(record.createdAt).toLocaleString('vi-VN')}</div>
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
      dataIndex: 'isApproved',
      width: 120,
      render: (isApproved) => (
        <Tag color={isApproved ? 'green' : 'red'}>
          {isApproved ? 'Đang hiện' : 'Đang ẩn'}
        </Tag>
      )
    },
    {
      title: 'THAO TÁC',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
           <Button 
            icon={record.isApproved ? <EyeInvisibleOutlined /> : <EyeOutlined />} 
            size="small" 
            onClick={() => handleToggleApprove(record._id)}
            className={record.isApproved ? "text-orange-500 border-orange-100 bg-orange-50" : "text-green-500 border-green-100 bg-green-50"} 
            title={record.isApproved ? "Ẩn đánh giá" : "Hiện đánh giá"}
           />
           <Button icon={<DeleteOutlined />} size="small" danger className="bg-red-50 border-red-100" onClick={() => handleDelete(record._id)} />
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
         <ReviewStat title="Tổng đánh giá" value={pagination.total} icon={<MessageOutlined />} color="bg-light-primary text-brand-500" />
         <ReviewStat title="Bình luận mới" value={data.length} icon={<StarFilled />} color="bg-yellow-50 text-yellow-500" />
         <ReviewStat title="Trang hiện tại" value={pagination.current} icon={<FilterOutlined />} color="bg-orange-50 text-orange-500" />
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
         <div className="flex justify-between mb-4">
            <div className="flex gap-3">
               <Input 
                prefix={<SearchOutlined className="text-gray-400" />} 
                placeholder="Tìm khách hàng..." 
                className="w-[300px] rounded-xl bg-[#F4F7FE] border-none" 
                onPressEnter={(e) => handleFilterChange('search', e.target.value)}
               />
               <Select defaultValue="all" className="w-[150px] custom-select-metrix bg-[#F4F7FE] rounded-xl" onChange={(v) => handleFilterChange('rating', v)}>
                  <Option value="all">Tất cả sao</Option>
                  <Option value="5">5 Sao</Option>
                  <Option value="4">4 Sao</Option>
                  <Option value="3">3 Sao</Option>
                  <Option value="2">2 Sao</Option>
                  <Option value="1">1 Sao</Option>
               </Select>
               <Select defaultValue="all" className="w-[150px] custom-select-metrix bg-[#F4F7FE] rounded-xl" onChange={(v) => handleFilterChange('isApproved', v)}>
                  <Option value="all">Tất cả trạng thái</Option>
                  <Option value="true">Đang hiện</Option>
                  <Option value="false">Đang ẩn</Option>
               </Select>
            </div>
         </div>
         <Table 
          columns={columns} 
          dataSource={data} 
          pagination={pagination} 
          onChange={handleTableChange}
          loading={loading}
          className="custom-table-metrix" 
         />
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
            <TextArea 
              rows={4} 
              placeholder="Nhập câu trả lời của shop..." 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;