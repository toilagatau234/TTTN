import React, { useState, useEffect } from 'react';
import { Table, Progress, Tooltip, message } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import statsService from '../../../../services/statsService';

const ComplexTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const res = await statsService.getTopProducts({ limit: 5 });
        if (res.success) {
          // Format data for table
          const formattedData = res.data.map((item) => ({
            key: item._id,
            name: item.name,
            image: item.images?.[0]?.url || 'https://placehold.co/64',
            status: item.stock === 0 ? 'Error' : (item.stock < 10 ? 'Disable' : 'Approved'),
            price: `${item.price.toLocaleString()} ₫`,
            stock: item.stock,
          }));
          setData(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch top products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  const columns = [
    {
      title: 'TÊN SẢN PHẨM',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
      render: (text, record) => (
        <div className="flex items-center gap-3">
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
      render: (stockVal) => (
        <div className="w-full max-w-[140px]">
           <div className="flex justify-between mb-1">
             <span className="text-xs font-medium text-gray-500">{stockVal} Sp</span>
          </div>
          <Tooltip title={`Tồn kho: ${stockVal} sản phẩm`}>
            <Progress 
              percent={stockVal > 100 ? 100 : stockVal} 
              showInfo={false} 
              strokeColor={stockVal < 10 ? "#FF4D4F" : "#4318FF"} 
              trailColor="#EFF4FB"
              size="small"
              strokeLinecap="round" 
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={false} 
        loading={loading}
        className="custom-table-metrix"
      />
    </div>
  );
};

export default ComplexTable;