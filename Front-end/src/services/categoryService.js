import axiosClient from "./axiosClient";

const categoryService = {
  // Lấy danh sách
  getAll: () => {
    return axiosClient.get('/categories');
  },
  
  // Tạo mới
  create: (data) => {
    return axiosClient.post('/categories', data);
  },

  // Cập nhật
  update: (id, data) => {
    return axiosClient.put(`/categories/${id}`, data);
  },

  // Xóa
  delete: (id) => {
    return axiosClient.delete(`/categories/${id}`);
  }
};

export default categoryService;