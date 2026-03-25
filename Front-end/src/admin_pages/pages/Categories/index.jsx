import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, message, Popconfirm, Avatar } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, FileImageOutlined } from '@ant-design/icons';
import categoryService from '../../../services/categoryService'; // Import API Service
import CreateCategoryModal from './components/CreateCategoryModal';

const CategoryPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // 1. Hàm gọi API lấy danh sách
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll();
      if (res.success) {
        // Gán key cho Table của Antd (dùng _id của MongoDB)
        const mappedData = res.data.map(item => ({ ...item, key: item._id }));
        setData(mappedData);
        setFilteredData(mappedData);
      }
    } catch (error) {
      message.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component vừa chạy
  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý tìm kiếm
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredData(filtered);
    }
  }, [searchText, data]);

  // 2. Xử lý Thêm mới hoặc Cập nhật
  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingItem) {
        // Nếu đang sửa -> Gọi API Update
        await categoryService.updateCategory(editingItem._id, formData);
        message.success('Cập nhật thành công!');
      } else {
        // Nếu tạo mới -> Gọi API Create
        await categoryService.createCategory(formData);
        message.success('Tạo danh mục mới thành công!');
      }

      setIsModalOpen(false);
      fetchData(); // Load lại bảng dữ liệu
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // 3. Xử lý Xóa
  const handleDelete = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      message.success('Đã xóa danh mục');
      fetchData(); // Load lại bảng
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  // 4. Mở modal ở chế độ Sửa
  const openEditModal = (record) => {
    setEditingItem(record);
    setIsModalOpen(true);
  };

  // 5. Mở modal ở chế độ Thêm mới
  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Hình ảnh</span>,
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (img) => (
        <div className="pl-2 flex items-center justify-center">
          <Avatar
            shape="square"
            size={72}
            src={img}
            icon={<FileImageOutlined />}
            className="rounded-[20px] border-2 border-white shadow-sm group-hover:scale-110 transition-transform duration-500 bg-gray-50"
          />
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tên danh mục</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-black text-[#2B3674] text-sm tracking-tight">{text}</span>,
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Mô tả chi tiết</span>,
      dataIndex: 'description',
      key: 'description',
      render: (text) => <span className="text-[11px] font-bold text-gray-400 line-clamp-2 max-w-[300px]">{text || 'Không có mô tả chi tiết cho danh mục này.'}</span>,
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          <span className="text-[10px] font-black uppercase tracking-wider">{isActive ? 'Đang hiển thị' : 'Đang ẩn'}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-right pr-2">Thao tác</span>,
      key: 'action',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <div className="flex justify-end gap-2 pr-2">
          <Button
            icon={<EditOutlined />}
            size="large"
            className="w-10 h-10 rounded-xl border-none bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title={<span className="font-black">Xác nhận xóa?</span>}
            description="Dữ liệu danh mục sẽ bị xóa vĩnh viễn."
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa ngay"
            cancelText="Hủy"
            okButtonProps={{ danger: true, className: "rounded-lg font-bold" }}
            cancelButtonProps={{ className: "rounded-lg font-bold" }}
          >
            <Button
              icon={<DeleteOutlined />}
              size="large"
              danger
              className="w-10 h-10 rounded-xl border-none bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2">
        <h3 className="text-2xl font-black text-[#2B3674] m-0 tracking-tighter">Cấu trúc Danh mục</h3>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          className="bg-blue-600 h-12 px-8 rounded-2xl font-black shadow-lg shadow-blue-100 border-none hover:bg-blue-500 transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest text-xs"
        >
          Thêm danh mục mới
        </Button>
      </div>

      {/* Main Container: Filter & Table */}
      <div className="bg-white p-8 rounded-[32px] shadow-premium border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap gap-4 mb-8 justify-between items-center relative z-10">
          <div className="relative group">
              <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-20" />
              <Input
                placeholder="Tìm danh mục theo tên hoặc mô tả..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="w-full sm:w-[420px] h-[48px] rounded-2xl border-none bg-[#F4F7FE] pl-11 pr-4 font-bold text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
              />
          </div>
          <div className="px-4 py-2 bg-[#F4F7FE] rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest border border-white/50">
            Tổng bách khoa: <span className="text-[#2B3674]">{filteredData.length}</span>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            pageSize: 8,
            className: "premium-pagination",
            showTotal: (total, range) => <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{range[0]}-{range[1]} của {total} danh mục</span>,
          }}
          className="premium-admin-table"
          rowClassName="group hover:bg-blue-50/20 transition-all cursor-pointer"
        />
      </div>

      <CreateCategoryModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={handleCreateOrUpdate}
        initialData={editingItem}
      />
    </div>
  );
};

export default CategoryPage;