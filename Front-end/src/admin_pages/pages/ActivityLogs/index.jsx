import React, { useState, useEffect } from 'react';
import { Table, Tag, Avatar, Input, Select, DatePicker, Button, Card, message } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import activityLogService from '../../../services/activityLogService';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ActivityLogsPage = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState(undefined);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await activityLogService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        action: actionFilter || undefined
      });
      if (response.success) {
        const mappedData = response.data.map(item => ({
          ...item,
          key: item._id
        }));
        setLogs(mappedData);
        setPagination(prev => ({ ...prev, total: response.pagination.total }));
      }
    } catch (error) {
      message.error('Không thể tải danh sách nhật ký');
    } finally {
      setLoading(false);
    }
  };

  const getActionTag = (action) => {
    switch (action) {
      case 'CREATE': return <Tag color="green" className="font-bold">THÊM MỚI</Tag>;
      case 'UPDATE': return <Tag color="blue" className="font-bold">CẬP NHẬT</Tag>;
      case 'DELETE': return <Tag color="red" className="font-bold">XÓA BỎ</Tag>;
      case 'BLOCK': return <Tag color="magenta" className="font-bold">KHÓA</Tag>;
      default: return <Tag color="default">{action}</Tag>;
    }
  };

  const columns = [
    {
      title: 'NGƯỜI THỰC HIỆN',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => (
        <div className="flex items-center gap-3">
          <Avatar src={userId?.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-bold text-navy-700 text-sm">{userId ? userId.name : 'Hệ thống'}</div>
            <div className="text-xs text-gray-400">{userId ? userId.role : ''}</div>
          </div>
        </div>
      )
    },
    {
      title: 'HÀNH ĐỘNG',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => getActionTag(action)
    },
    {
      title: 'ĐỐI TƯỢNG & CHI TIẾT',
      key: 'detail',
      render: (_, record) => (
        <div>
           <div className="font-bold text-navy-700 text-sm">{record.target}</div>
           <div className="text-gray-500 text-xs">{record.description}</div>
        </div>
      )
    },
    {
      title: 'IP / THIẾT BỊ',
      dataIndex: 'ip',
      key: 'ip',
      render: (text) => <span className="text-gray-400 font-mono text-xs">{text || 'N/A'}</span>
    },
    {
      title: 'THỜI GIAN',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => <span className="text-gray-500 font-medium text-sm">{new Date(text).toLocaleString('vi-VN')}</span>
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <div className="flex gap-2">
           <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>Làm mới</Button>
        </div>
      </div>

      <Card className="rounded-[20px] shadow-sm border-none p-0">
         {/* Filter Bar */}
         <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
               <Input 
                  prefix={<SearchOutlined className="text-gray-400" />} 
                  placeholder="Tìm nội dung..." 
                  className="w-[250px] rounded-xl bg-[#F4F7FE] border-none h-[40px]" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
               />
               <Select 
                  placeholder="Loại hành động" 
                  className="w-[160px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl" 
                  allowClear
                  value={actionFilter}
                  onChange={value => setActionFilter(value)}
               >
                  <Option value="CREATE">Thêm mới</Option>
                  <Option value="UPDATE">Cập nhật</Option>
                  <Option value="DELETE">Xóa</Option>
               </Select>
            </div>
         </div>

         {/* Table */}
         <Table 
            columns={columns} 
            dataSource={logs} 
            pagination={{ 
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                onChange: (page) => setPagination(prev => ({ ...prev, page }))
            }} 
            className="custom-table-metrix"
            loading={loading}
         />
      </Card>
    </div>
  );
};

export default ActivityLogsPage;