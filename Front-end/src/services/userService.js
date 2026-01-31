import axiosClient from "./axiosClient";

const USER_ENDPOINT = 'http://localhost:4000/api'; 

const userService = {
  // Lấy danh sách khách hàng
  getAll: (params) => {
    return axiosClient.get(USER_ENDPOINT, { params });
  },

  // Thêm khách hàng mới
  add: (data) => {
    return axiosClient.post(USER_ENDPOINT, data);
  },

  // Cập nhật thông tin
  update: (id, data) => {
    return axiosClient.put(`${USER_ENDPOINT}/${id}`, data);
  },

  // Xóa/Khóa khách hàng
  delete: (id) => {
    return axiosClient.delete(`${USER_ENDPOINT}/${id}`);
  }
};

export default userService;
