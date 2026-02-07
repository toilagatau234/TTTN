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
      title: 'HÌNH ẢNH',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (img) => (
        <Avatar
          shape="square"
          size={64}
          src={img}
          icon={<FileImageOutlined />}
          className="rounded-lg border border-gray-200 bg-gray-50"
        />
      ),
    },
    {
      title: 'TÊN DANH MỤC',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-bold text-navy-700">{text}</span>,
    },
    {
      title: 'MÔ TẢ',
      dataIndex: 'description',
      key: 'description',
      className: 'text-gray-500',
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} className="rounded-full px-3">
          {isActive ? 'Active' : 'Hidden'}
        </Tag>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<EditOutlined />}
            size="small"
            className="text-blue-500 border-blue-100 hover:bg-blue-50"
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Xóa danh mục?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              className="border-red-100 hover:bg-red-50"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          className="bg-brand-500 h-10 px-6 rounded-xl font-bold shadow-lg shadow-brand-500/50 border-none hover:bg-brand-600"
        >
          Thêm Mới
        </Button>
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm">
        <div className="flex justify-between mb-6">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm kiếm theo tên hoặc mô tả..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="w-[400px] h-[40px] rounded-xl bg-[#F4F7FE] border-none hover:bg-gray-100 focus:bg-white transition-all"
          />
          <div className="text-gray-500">
            Tổng: <span className="font-semibold text-navy-700">{filteredData.length}</span> danh mục
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} danh mục`,
          }}
          className="custom-table-metrix"
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