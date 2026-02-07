import axiosClient from './axiosClient';

const categoryService = {
    // Lấy danh sách danh mục
    getAll: () => {
        return axiosClient.get('/categories');
    },

    // Thêm mới danh mục
    createCategory: (data) => {
        return axiosClient.post('/categories', data);
    },

    // Xóa danh mục
    deleteCategory: (id) => {
        return axiosClient.delete(`/categories/${id}`);
    },
    
    // Cập nhật danh mục (nếu bạn cần sau này)
    updateCategory: (id, data) => {
        return axiosClient.put(`/categories/${id}`, data);
    }
};

export default categoryService;