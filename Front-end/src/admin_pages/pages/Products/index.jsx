import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Progress, Dropdown, Menu, message, Avatar, Popconfirm, Popover, Form, Badge } from 'antd';
import {
  PlusOutlined, SearchOutlined, FilterOutlined,
  MoreOutlined, EditOutlined, DeleteOutlined,
  ShopOutlined, CheckCircleOutlined, WarningOutlined,
  ClockCircleOutlined, StarOutlined, ArrowUpOutlined,
  FileImageOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import PermissionGate from '../../components/PermissionGate';
import { ACTION_PERMISSIONS } from '../../../constants/roles';
import productService from '../../../services/productService';
import categoryService from '../../../services/categoryService';
import statsService from '../../../services/statsService';
import CreateProductModal from './components/CreateProductModal';
import ViewProductModal from './components/ViewProductModal';

const { Option } = Select;

// --- OVERVIEW WIDGET ---
const ProductOverviewWidget = ({ total, active }) => {
  return (
    <div className="bg-white rounded-[24px] shadow-premium p-8 flex flex-col justify-center h-full border border-white/50 relative overflow-hidden group animate-in slide-in-from-left-4 duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      <h4 className="text-xl font-black text-[#2B3674] mb-6 relative z-10 tracking-tight">Tổng quan kho hàng</h4>
      <div className="flex items-center justify-between gap-8 relative z-10">
        {/* All Products */}
        <div className="flex items-center gap-5 flex-1 p-5 rounded-3xl bg-[#F4F7FE] border border-transparent hover:border-blue-100 transition-all group/item">
          <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 flex items-center justify-center text-2xl shadow-sm group-hover/item:scale-110 transition-transform">
            <ShopOutlined />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng sản phẩm</p>
            <h3 className="text-3xl font-black text-[#2B3674] m-0 tracking-tighter">{total || 0}</h3>
            <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-1">
              <ArrowUpOutlined /> +15% <span className="text-gray-400 font-medium tracking-tight">so với tháng trước</span>
            </p>
          </div>
        </div>
        
        <div className="h-16 w-px bg-gray-100 hidden md:block"></div>

        {/* Active Products */}
        <div className="flex items-center gap-5 flex-1 p-5 rounded-3xl bg-emerald-50/50 border border-transparent hover:border-emerald-100 transition-all group/item">
          <div className="w-14 h-14 rounded-2xl bg-white text-emerald-500 flex items-center justify-center text-2xl shadow-sm group-hover/item:scale-110 transition-transform">
            <CheckCircleOutlined />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đang hoạt động</p>
            <h3 className="text-3xl font-black text-[#2B3674] m-0 tracking-tighter">{active || 0}</h3>
            {total > 0 && (
              <div className="mt-2 h-1.5 w-24 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(active/total)*100}%` }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ALERT WIDGET ---
const ProductAlertWidget = ({ alerts }) => {
  const alertData = [
    { label: 'Sắp hết hàng', value: alerts?.lowStock || 0, icon: <WarningOutlined />, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Hết hàng', value: alerts?.outOfStock || 0, icon: <ClockCircleOutlined />, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Đánh giá thấp', value: alerts?.lowRating || 0, icon: <StarOutlined />, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="bg-white rounded-[24px] shadow-premium p-8 h-full flex flex-col border border-white/50 relative overflow-hidden group animate-in slide-in-from-right-4 duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h4 className="text-xl font-black text-[#2B3674] tracking-tight">Cần chú ý (Alerts)</h4>
        <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest">Ưu tiên cao</span>
      </div>
      <div className="flex justify-between gap-6 flex-1 items-center relative z-10">
        {alertData.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 text-center p-4 rounded-3xl hover:bg-[#F4F7FE]/50 transition-all cursor-pointer group/alert border border-transparent hover:border-blue-50">
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center text-2xl mb-3 transition-all group-hover/alert:scale-110 group-alert:shadow-sm`}>
              {item.icon}
            </div>
            <h3 className="text-3xl font-black text-[#2B3674] m-0 tracking-tighter">{item.value}</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductPage = () => {
  const navigate = useNavigate();

  // Lấy thông tin user để check quyền hiển thị thao tác
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);

  // Widget State
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    alerts: { outOfStock: 0, lowStock: 0, lowRating: 0 }
  });

  // Load Categories for Filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        if (res.success) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error("Failed to load categories for filter", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products & Stats
  const fetchProducts = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        keyword: searchText,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const [res, statsRes] = await Promise.all([
        productService.getAll(params),
        statsService.getProductStats()
      ]);

      if (res.success) {
        setData(res.data);
        setPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total
        });
      }
      
      if (statsRes.success) {
        setProductStats(statsRes.data);
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  // Debounce Search Text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // 500ms delay
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    fetchProducts(1, pagination.pageSize);
  }, [categoryFilter, statusFilter, debouncedSearchText]);

  // Handle Search
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const onSearch = () => {
    fetchProducts(1, pagination.pageSize);
  };

  // Handle Table Change (Pagination)
  const handleTableChange = (newPagination) => {
    fetchProducts(newPagination.current, newPagination.pageSize);
  };

  // Handle Create/Update
  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingItem) {
        await productService.update(editingItem._id, formData);
        message.success("Cập nhật sản phẩm thành công!");
      } else {
        await productService.add(formData);
        message.success("Tạo sản phẩm mới thành công!");
      }
      setIsModalOpen(false);
      fetchProducts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await productService.delete(id);
      message.success("Đã xóa sản phẩm");
      fetchProducts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("Xóa thất bại");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingItem(record);
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Sản phẩm</span>,
      dataIndex: 'name',
      key: 'name',
      width: 320,
      render: (text, record) => (
        <div className="flex items-center gap-4 py-2 pl-2 group/card">
          <div className="relative shrink-0">
            <Avatar
              src={record.images && record.images.length > 0 ? record.images[0].url : ''}
              icon={<FileImageOutlined />}
              shape="square"
              size={60}
              className="rounded-2xl border border-gray-100 shadow-sm group-hover/card:scale-110 transition-transform duration-500"
            />
            {record.isHot && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] text-white flex items-center justify-center font-black">!</span></span>}
          </div>
          <div className="flex flex-col">
            <h5 className="font-black text-[#2B3674] text-sm m-0 hover:text-blue-600 cursor-pointer transition-colors leading-tight line-clamp-1">{text}</h5>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded-md">ID: {record._id.slice(-6).toUpperCase()}</span>
              {record.isNewProduct && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-md">New</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Danh mục</span>,
      dataIndex: 'category',
      key: 'category',
      render: (cat) => (
        <div className="px-3 py-1 bg-[#F4F7FE] text-[#2B3674] text-[11px] font-black rounded-full inline-block border border-transparent hover:border-blue-100 transition-colors">
          {cat?.name || 'N/A'}
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Giá niêm yết</span>,
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span className="font-black text-[#2B3674]">{price?.toLocaleString()} ₫</span>,
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tồn kho</span>,
      dataIndex: 'stock',
      key: 'stock',
      width: 200,
      render: (stock) => (
        <div className="w-full max-w-[140px]">
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stock} đơn vị</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ${stock < 10 ? 'bg-rose-500' : 'bg-blue-600'}`}
               style={{ width: `${Math.min(100, (stock || 0))}%` }}
             ></div>
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
        
        if (status === 'active' || !status) {
          bg = 'bg-emerald-50';
          dot = 'bg-emerald-500';
          textColor = 'text-emerald-700';
          text = 'Đang bán';
        } else if (status === 'out_of_stock') {
          bg = 'bg-rose-50';
          dot = 'bg-rose-500';
          textColor = 'text-rose-700';
          text = 'Hết hàng';
        } else {
          bg = 'bg-gray-50';
          dot = 'bg-gray-500';
          textColor = 'text-gray-700';
          text = 'Ngừng bán';
        }

        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg} ${textColor} border border-transparent`}>
            <span className={`w-2 h-2 rounded-full ${dot}`}></span>
            <span className="text-[11px] font-black uppercase tracking-wider">{text}</span>
          </div>
        );
      },
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Thao tác</span>,
      key: 'action',
      align: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            icon: <FileTextOutlined className="text-blue-500" />,
            label: <span className="font-bold text-gray-600">Xem chi tiết</span>,
            onClick: () => {
              setViewingItem(record);
              setIsViewOpen(true);
            }
          },
          {
            key: 'edit',
            icon: <EditOutlined className="text-amber-500" />,
            label: <span className="font-bold text-gray-600">Chỉnh sửa</span>,
            onClick: () => openEditModal(record)
          }
        ];

        if (user && ACTION_PERMISSIONS.CAN_DELETE.includes(user.role)) {
          items.push({ type: 'divider' });
          items.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
            label: (
              <Popconfirm
                title={<span className="font-black text-rose-600">Xác nhận xóa?</span>}
                description="Dữ liệu này sẽ không thể khôi phục."
                onConfirm={() => handleDelete(record._id)}
                okText="Xóa ngay"
                cancelText="Hủy"
                okButtonProps={{ danger: true, className: "rounded-lg" }}
              >
                <span className="font-bold">Xóa sản phẩm</span>
              </Popconfirm>
            )
          });
        }

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" arrow>
            <Button type="text" className="hover:bg-blue-50 rounded-xl" icon={<MoreOutlined className="text-gray-400 text-lg" />} />
          </Dropdown>
        );
      }
    },
  ];

  return (
    <div className="w-full">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2">
        <h3 className="text-2xl font-black text-[#2B3674] m-0 tracking-tighter">Danh sách sản phẩm</h3>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          className="bg-blue-600 h-12 px-8 rounded-2xl font-black shadow-lg shadow-blue-100 border-none hover:bg-blue-500 transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest text-xs"
        >
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* --- WIDGETS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProductOverviewWidget total={productStats.totalProducts} active={productStats.activeProducts} />
        <ProductAlertWidget alerts={productStats.alerts} />
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white p-8 rounded-[32px] shadow-premium border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap gap-4 mb-8 justify-between items-center relative z-10">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative group">
               <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-20" />
               <Input
                  placeholder="Tìm kiếm hoa theo mã hoặc tên..."
                  className="w-[320px] rounded-2xl border-none bg-[#F4F7FE] h-[48px] pl-11 pr-4 font-bold text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                  value={searchText}
                  onChange={handleSearch}
                  allowClear
               />
            </div>
          </div>

          <div className="flex gap-3">
            <Popover
              placement="bottomRight"
              title={<div className="font-black text-[#2B3674] p-3 border-b border-gray-100 uppercase tracking-widest text-xs">Bộ lọc nâng cao</div>}
              trigger="click"
              content={
                <Form layout="vertical" className="w-[320px] p-3">
                  <Form.Item label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Danh mục sản phẩm</span>} className="mb-4">
                    <Select
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      className="w-full premium-select"
                      size="large"
                    >
                      <Option value="all">Tất cả danh mục</Option>
                      {categories.map(cat => (
                        <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái kinh doanh</span>} className="mb-6">
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      className="w-full premium-select"
                      size="large"
                    >
                      <Option value="all">Tất cả trạng thái</Option>
                      <Option value="active">Đang mở bán</Option>
                      <Option value="out_of_stock">Đã hết hàng</Option>
                      <Option value="inactive">Ngừng kinh doanh</Option>
                    </Select>
                  </Form.Item>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <Button 
                      type="text" 
                      onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }} 
                      className="text-gray-400 font-bold hover:text-rose-500"
                    >
                      Đặt lại
                    </Button>
                    <Button type="primary" className="bg-blue-600 rounded-xl font-bold px-6 border-none">
                      Áp dụng
                    </Button>
                  </div>
                </Form>
              }
            >
              <Button icon={<FilterOutlined />} className="rounded-2xl h-[48px] px-6 font-bold text-gray-500 bg-[#F4F7FE] border-none hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2">
                Bộ lọc
                {(categoryFilter !== 'all' || statusFilter !== 'all') && <Badge dot status="processing" className="ml-1" />}
              </Button>
            </Popover>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            ...pagination,
            className: "premium-pagination",
          }}
          onChange={handleTableChange}
          loading={loading}
          className="premium-admin-table"
          rowKey="_id"
          rowClassName="group hover:bg-blue-50/20 transition-colors cursor-pointer"
        />
      </div>

      <CreateProductModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={handleCreateOrUpdate}
        initialData={editingItem}
      />

      <ViewProductModal
        open={isViewOpen}
        onCancel={() => { setIsViewOpen(false); setViewingItem(null); }}
        data={viewingItem}
      />

    </div>
  );
};

export default ProductPage;