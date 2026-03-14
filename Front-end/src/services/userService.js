import axiosClient from "./axiosClient";

const USER_ENDPOINT = '/users';
const UPLOAD_ENDPOINT = '/upload';

const userService = {
  // --- CURRENT USER PROFILE ---
  getProfile: () => {
    return axiosClient.get(`${USER_ENDPOINT}/profile`);
  },
  updateProfile: (data) => {
    return axiosClient.put(`${USER_ENDPOINT}/profile`, data);
  },

  // --- ADMIN ROUTES ---
  getAll: (params) => {
    return axiosClient.get(USER_ENDPOINT, { params });
  },
  add: (data) => {
    return axiosClient.post(USER_ENDPOINT, data);
  },
  update: (id, data) => {
    return axiosClient.put(`${USER_ENDPOINT}/${id}`, data);
  },
  delete: (id) => {
    return axiosClient.delete(`${USER_ENDPOINT}/${id}`);
  },

  // --- UPLOAD ROUTES ---
  uploadImage: (formData) => {
    return axiosClient.post(UPLOAD_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default userService;
