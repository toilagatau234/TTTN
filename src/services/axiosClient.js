import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:4000/api', // sửa dường dẫn backend
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Xử lý lỗi chung (401 Unauthorized thì logout)
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/admin/login';
    }
    throw error;
  }
);

export default axiosClient;