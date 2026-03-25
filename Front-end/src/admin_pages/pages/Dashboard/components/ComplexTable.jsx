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
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Sản phẩm</span>,
      dataIndex: 'name',
      key: 'name',
      width: '40%',
      render: (text, record) => (
        <div className="flex items-center gap-4 py-2 pl-2">
          <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500">
             <img 
               src={record.image} 
               alt={text} 
               className="h-full w-full object-cover"
             />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[#2B3674] text-sm hover:text-blue-600 cursor-pointer transition-colors line-clamp-1">
              {text}
            </span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">ID: {record.key.slice(-6)}</span>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let bg, dot, text, textColor;
        
        switch (status) {
          case 'Approved':
            bg = 'bg-emerald-50';
            dot = 'bg-emerald-500';
            textColor = 'text-emerald-700';
            text = 'Đang bán';
            break;
          case 'Disable':
            bg = 'bg-amber-50';
            dot = 'bg-amber-500';
            textColor = 'text-amber-700';
            text = 'Tạm ngưng';
            break;
          case 'Error':
            bg = 'bg-rose-50';
            dot = 'bg-rose-500';
            textColor = 'text-rose-700';
            text = 'Hết hàng';
            break;
          default:
            bg = 'bg-gray-50';
            dot = 'bg-gray-500';
            textColor = 'text-gray-700';
            text = 'Không rõ';
        }

        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg} ${textColor} border border-transparent`}>
            <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`}></span>
            <span className="text-[11px] font-black uppercase tracking-wider">{text}</span>
          </div>
        );
      },
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Giá niêm yết</span>,
      dataIndex: 'price',
      key: 'price',
      render: (text) => <span className="font-black text-[#2B3674]">{text}</span>,
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tồn kho</span>,
      dataIndex: 'stock',
      key: 'stock',
      render: (stockVal) => (
        <div className="w-full max-w-[120px]">
           <div className="flex justify-between mb-1.5">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stockVal} đơn vị</span>
          </div>
          <Tooltip title={`Hàng trong kho: ${stockVal}`}>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full rounded-full transition-all duration-1000 ${stockVal < 10 ? 'bg-rose-500' : 'bg-blue-600'}`}
                 style={{ width: `${Math.min(100, (stockVal / 200) * 100)}%` }}
               ></div>
            </div>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={false} 
        loading={loading}
        className="premium-admin-table"
        rowClassName="group hover:bg-blue-50/30 transition-colors cursor-pointer"
      />
    </div>
  );
};

export default ComplexTable;