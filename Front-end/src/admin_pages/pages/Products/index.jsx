import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Progress, Dropdown, Menu, message, Avatar, Popconfirm } from 'antd';
import {
  PlusOutlined, SearchOutlined, FilterOutlined,
  MoreOutlined, EditOutlined, DeleteOutlined,
  ShopOutlined, CheckCircleOutlined, WarningOutlined,
  ClockCircleOutlined, StarOutlined, ArrowUpOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import PermissionGate from '../../components/PermissionGate';
import { ACTION_PERMISSIONS } from '../../../constants/roles';
import productService from '../../../services/productService';
import categoryService from '../../../services/categoryService';
import CreateProductModal from './components/CreateProductModal';

const { Option } = Select;

// --- OVERVIEW WIDGET ---
const ProductOverviewWidget = ({ total, active }) => {
  return (
    <div className="bg-white rounded-[20px] shadow-sm p-6 flex flex-col justify-center h-full">
      <h4 className="text-lg font-bold text-navy-700 mb-5">Tổng quan kho hàng</h4>
      <div className="flex items-center justify-between gap-6">
        {/* All Products */}
        <div className="flex items-center gap-4 flex-1 p-4 rounded-2xl bg-light-primary">
          <div className="w-12 h-12 rounded-full bg-white text-brand-500 flex items-center justify-center text-2xl shadow-sm">
            <ShopOutlined />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Tổng sản phẩm</p>
            <h3 className="text-2xl font-bold text-navy-700">{total || 0}</h3>
            <p className="text-xs font-bold text-green-500 flex items-center gap-1">
              <ArrowUpOutlined /> +15% <span className="text-gray-400 font-medium">so với tháng trước</span>
            </p>
          </div>
        </div>
        <div className="h-12 w-[1px] bg-gray-200"></div>
        {/* Active Products */}
        <div className="flex items-center gap-4 flex-1 p-4 rounded-2xl bg-green-50">
          <div className="w-12 h-12 rounded-full bg-white text-green-500 flex items-center justify-center text-2xl shadow-sm">
            <CheckCircleOutlined />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Đang hoạt động</p>
            <h3 className="text-2xl font-bold text-navy-700">{active || 0}</h3>
            <p className="text-xs font-bold text-navy-700 flex items-center gap-1">
              98% <span className="text-gray-400 font-medium">trên tổng số</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ALERT WIDGET ---
const ProductAlertWidget = () => {
  const [filter, setFilter] = useState('today');

  const alerts = [
    { label: 'Low Stock', value: 5, icon: <WarningOutlined />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Expired', value: 2, icon: <ClockCircleOutlined />, color: 'text-red-500', bg: 'bg-red-50' },
    { label: '1 Star Rating', value: 1, icon: <StarOutlined />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="bg-white rounded-[20px] shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-bold text-navy-700">Cần chú ý (Alerts)</h4>
        <Select
          value={filter}
          onChange={setFilter}
          bordered={false}
          className="bg-[#F4F7FE] rounded-lg font-bold text-gray-600 min-w-[110px]"
        >
          <Option value="today">Hôm nay</Option>
          <Option value="yesterday">Hôm qua</Option>
          <Option value="week">Tuần này</Option>
        </Select>
      </div>
      <div className="flex justify-between gap-4 flex-1 items-center">
        {alerts.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 text-center p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className={`w-10 h-10 rounded-full ${item.bg} ${item.color} flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110`}>
              {item.icon}
            </div>
            <h3 className="text-2xl font-bold text-navy-700">{item.value}</h3>
            <p className="text-xs text-gray-400 font-medium">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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

  // Fetch Products
  const fetchProducts = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        keyword: searchText,
        category: categoryFilter
      };

      const res = await productService.getAll(params);
      if (res.success) {
        setData(res.data);
        setPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total
        });
      }
    } catch (error) {
      message.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(pagination.current, pagination.pageSize);
  }, [categoryFilter]); // Reload when filter changes. Search is handled by explicit enter or button, or debounce (impl later)

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
      title: 'SẢN PHẨM',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.images && record.images.length > 0 ? record.images[0].url : ''}
            icon={<FileImageOutlined />}
            shape="square"
            size={54}
            className="rounded-xl border border-gray-100"
          />
          <div>
            <h5 className="font-bold text-navy-700 text-sm m-0 line-clamp-1">{text}</h5>
            <span className="text-gray-400 text-xs">#{record._id.slice(-6).toUpperCase()}</span>
            {record.isHot && <Tag color="red" className="ml-2 text-[10px]">HOT</Tag>}
            {record.isNewProduct && <Tag color="blue" className="ml-1 text-[10px]">NEW</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: 'DANH MỤC',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="blue">{cat?.name || 'N/A'}</Tag>,
    },
    {
      title: 'GIÁ',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span className="font-bold text-brand-500">{price?.toLocaleString()} ₫</span>,
    },
    {
      title: 'TỒN KHO',
      dataIndex: 'stock',
      key: 'stock',
      width: 200,
      render: (stock) => (
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">{stock} sản phẩm</span>
          </div>
          <Progress
            percent={stock > 100 ? 100 : (stock || 0)}
            showInfo={false}
            strokeColor={stock < 10 ? '#FF4D4F' : '#4318FF'}
            trailColor="#EFF4FB"
            size="small"
          />
        </div>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let text = 'Đang bán';
        if (status === 'out_of_stock') { color = 'red'; text = 'Hết hàng'; }
        if (status === 'inactive') { color = 'default'; text = 'Ngừng bán'; }

        return <Tag color={color} className="rounded-md font-medium">{text}</Tag>;
      },
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="1" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                Chỉnh sửa
              </Menu.Item>

              {/* Bảo vệ nút Xóa: Chỉ Admin mới thấy */}
              <PermissionGate allowedRoles={ACTION_PERMISSIONS.CAN_DELETE}>
                <Menu.Item
                  key="2"
                  icon={<DeleteOutlined />}
                  danger
                >
                  <Popconfirm
                    title="Xóa sản phẩm?"
                    description="Hành động này không thể hoàn tác"
                    onConfirm={() => handleDelete(record._id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    Xóa
                  </Popconfirm>
                </Menu.Item>
              </PermissionGate>
            </Menu>
          }
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined className="text-gray-400 text-lg" />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-700">Quản Lý Sản Phẩm</h1>
          <p className="text-gray-500 mt-1">Quản lý kho hàng và danh sách hoa</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          className="bg-brand-500 h-10 px-6 rounded-xl font-medium shadow-brand-500/50 border-none hover:bg-brand-600"
        >
          Thêm sản phẩm
        </Button>
      </div>

      {/* --- WIDGETS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ProductOverviewWidget total={pagination.total} active={pagination.total} />
        <ProductAlertWidget />
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
        <div className="flex flex-wrap gap-4 mb-6 justify-between">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm tên hoa..."
              className="w-[250px] rounded-xl border-none bg-[#F4F7FE] h-[40px]"
              value={searchText}
              onChange={handleSearch}
              onPressEnter={onSearch}
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="w-[180px] h-[40px] custom-select-metrix bg-[#F4F7FE] rounded-xl"
              bordered={false}
            >
              <Option value="all">Tất cả danh mục</Option>
              {categories.map(cat => (
                <Option key={cat._id} value={cat._id}>{cat.name}</Option>
              ))}
            </Select>
          </div>
          <Button icon={<FilterOutlined />} className="rounded-xl h-[40px] text-gray-500" onClick={onSearch}>Lọc</Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          pagination={pagination}
          onChange={handleTableChange}
          loading={loading}
          className="custom-table-metrix"
          rowKey="_id"
        />
      </div>

      <CreateProductModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={handleCreateOrUpdate}
        initialData={editingItem}
      />

    </div>
  );
};

export default ProductPage;