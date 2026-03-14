import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào mỗi request
axiosClient.interceptors.request.use(async (config) => {
  // Lấy token từ LocalStorage trước mỗi request để đảm bảo là token mới nhất
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
        // console.log(`[Request] ${config.method.toUpperCase()} ${config.url} - Token applied`);
      }
    } catch (e) {
      console.error('[AxiosClient] Error parsing user from localStorage', e);
    }
  } else {
    // console.warn(`[Request] ${config.method.toUpperCase()} ${config.url} - No user found in localStorage`);
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
    // Tự động xử lý lỗi 401: Token không hợp lệ / hết hạn / chưa đăng nhập
    if (error.response && error.response.status === 401) {
      console.error('[AxiosClient] 401 Unauthorized detected:', error.config.url);
      console.log('[AxiosClient] Current user in localStorage:', localStorage.getItem('user'));
      
      localStorage.removeItem('user');
      
      // Chỉ redirect nếu đang ở trang admin (tránh loop ở trang login)
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && !currentPath.includes('/admin/login')) {
        console.warn('[AxiosClient] Redirecting to /admin/login due to 401');
        window.location.href = '/admin/login';
      }
    }
    throw error;
  }
);

export default axiosClient;