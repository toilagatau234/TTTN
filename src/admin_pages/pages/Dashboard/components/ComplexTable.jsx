import React from 'react';
import { Table, Progress, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const ComplexTable = () => {
  
  // 1. Dữ liệu giả lập (Sau này sẽ thay bằng dữ liệu từ API)
  const data = [
    {
      key: '1',
      name: 'Bó Hoa Hồng Đỏ (Red Rose)',
      image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=64&q=80',
      status: 'Approved',
      price: '550.000 ₫',
      stock: 90, // 90%
    },
    {
      key: '2',
      name: 'Lẵng Hoa Hướng Dương',
      image: 'https://images.unsplash.com/photo-1597826368522-9f4a53586d0e?auto=format&fit=crop&w=64&q=80',
      status: 'Disable',
      price: '850.000 ₫',
      stock: 15, // Sắp hết
    },
    {
      key: '3',
      name: 'Hoa Tulip Hà Lan',
      image: 'https://images.unsplash.com/photo-1588825838638-349f291350a4?auto=format&fit=crop&w=64&q=80',
      status: 'Error',
      price: '1.200.000 ₫',
      stock: 0, // Hết hàng
    },
    {
      key: '4',
      name: 'Hộp Hoa Baby Blue',
      image: 'https://images.unsplash.com/photo-1523694576728-a3672d5b61b4?auto=format&fit=crop&w=64&q=80',
      status: 'Approved',
      price: '450.000 ₫',
      stock: 100,
    },
  ];

  // 2. Định nghĩa các cột (Columns)
  const columns = [
    {
      title: 'TÊN SẢN PHẨM',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          {/* Ảnh sản phẩm bo góc */}
          <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm">
             <img 
               src={record.image} 
               alt={text} 
               className="h-full w-full object-cover"
             />
          </div>
          <span className="font-bold text-navy-700 text-sm hover:text-brand-500 cursor-pointer transition-colors">
            {text}
          </span>
        </div>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let icon, color, text;
        
        // Logic hiển thị trạng thái
        switch (status) {
          case 'Approved':
            icon = <CheckCircleOutlined />;
            color = 'text-green-500';
            text = 'Đang bán';
            break;
          case 'Disable':
            icon = <ExclamationCircleOutlined />;
            color = 'text-orange-500';
            text = 'Tạm ngưng';
            break;
          case 'Error':
            icon = <CloseCircleOutlined />;
            color = 'text-red-500';
            text = 'Hết hàng';
            break;
          default:
            icon = <InfoCircleOutlined />;
            color = 'text-gray-500';
            text = 'Không rõ';
        }

        return (
          <div className={`flex items-center gap-2 ${color}`}>
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-bold text-navy-700">{text}</span>
          </div>
        );
      },
    },
    {
      title: 'GIÁ BÁN',
      dataIndex: 'price',
      key: 'price',
      render: (text) => <span className="font-bold text-navy-700">{text}</span>,
    },
    {
      title: 'TỒN KHO',
      dataIndex: 'stock',
      key: 'stock',
      render: (percent) => (
        <div className="w-full max-w-[140px]">
          <div className="flex justify-between mb-1">
             <span className="text-xs font-medium text-gray-500">{percent}%</span>
          </div>
          <Tooltip title={`Còn lại: ${percent}%`}>
            <Progress 
              percent={percent} 
              showInfo={false} 
              // Đổi màu thanh dựa trên % (Đỏ nếu sắp hết, Xanh nếu còn nhiều)
              strokeColor={percent < 20 ? "#FF4D4F" : "#4318FF"} 
              trailColor="#EFF4FB"
              size="small"
              strokeLinecap="round" 
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // 3. Render
  return (
    <div className="w-full overflow-x-auto">
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={false} 
        className="custom-table-metrix" // Sử dụng lại class CSS chúng ta đã viết cho OrderPage
      />
    </div>
  );
};

export default ComplexTable;