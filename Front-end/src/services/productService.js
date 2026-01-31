import axiosClient from "./axiosClient";

const PRODUCT_ENDPOINT = '/products';

const productService = {
  // Lấy danh sách có phân trang & lọc
  getAll: (params) => {
    return axiosClient.get(PRODUCT_ENDPOINT, { params });
  },
  
  // Lấy chi tiết 1 sản phẩm
  get: (id) => {
    return axiosClient.get(`${PRODUCT_ENDPOINT}/${id}`);
  },

  // Thêm mới (Có upload ảnh nên dùng formData)
  add: (data) => {
    return axiosClient.post(PRODUCT_ENDPOINT, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  update: (id, data) => {
    return axiosClient.put(`${PRODUCT_ENDPOINT}/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`${PRODUCT_ENDPOINT}/${id}`);
  }
};

export default productService;