import axiosClient from "./axiosClient";

const authService = {
  // Đăng nhập
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },

  // Đăng ký
  register: (name, email, password) => {
    return axiosClient.post('/auth/register', { name, email, password });
  },

  // Lấy thông tin user hiện tại (từ token)
  getMe: () => {
    return axiosClient.get('/auth/me');
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('user');
  },

  // Lấy user từ localStorage
  getCurrentUser: () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user || null;
    } catch {
      return null;
    }
  },

  // Kiểm tra đã đăng nhập
  isLoggedIn: () => {
    const user = authService.getCurrentUser();
    return user && user.token ? true : false;
  },

  // Lưu user vào localStorage
  saveUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },
};

export default authService;