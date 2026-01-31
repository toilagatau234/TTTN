import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào mỗi request
axiosClient.interceptors.request.use(async (config) => {
  // Lấy token từ LocalStorage
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    throw error;
  }
);

export default axiosClient;