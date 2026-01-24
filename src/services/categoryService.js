import axiosClient from "./axiosClient";

const CATEGORY_ENDPOINT = '/categories'; // Backend route

const categoryService = {
  // Lấy tất cả danh mục
  getAll: (params) => {
    return axiosClient.get(CATEGORY_ENDPOINT, { params });
  },

  // Lấy chi tiết 1 danh mục
  get: (id) => {
    return axiosClient.get(`${CATEGORY_ENDPOINT}/${id}`);
  },

  // Thêm mới
  add: (data) => {
    return axiosClient.post(CATEGORY_ENDPOINT, data);
  },

  // Cập nhật
  update: (id, data) => {
    return axiosClient.put(`${CATEGORY_ENDPOINT}/${id}`, data);
  },

  // Xóa
  delete: (id) => {
    return axiosClient.delete(`${CATEGORY_ENDPOINT}/${id}`);
  }
};

export default categoryService;