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

  // Gửi mã OTP về email
  sendOtp: (email) => {
    return axiosClient.post('/auth/send-otp', { email });
  },

  // Xác nhận mã OTP
  verifyOtp: (email, code) => {
    return axiosClient.post('/auth/verify-otp', { email, code });
  },

  // Yêu cầu quên mật khẩu (gửi OTP)
  forgotPassword: (email) => {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  // Xác nhận đổi mật khẩu dựa trên OTP
  resetPassword: (email, code, newPassword) => {
    return axiosClient.post('/auth/reset-password', { email, code, newPassword });
  },

  // Lấy thông tin user hiện tại (từ token)
  getMe: () => {
    return axiosClient.get('/auth/me');
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    // Bắn event để các component khác tự update state (ví dụ Context, Header)
    window.dispatchEvent(new Event('authStatusChanged'));
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

  // Lấy token
  getToken: () => {
    const user = authService.getCurrentUser();
    return user ? user.token : null;
  },

  // Kiểm tra là Admin/Staff
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && ['Admin', 'Manager', 'Staff', 'Warehouse'].includes(user.role);
  },

  // Lưu user vào localStorage
  saveUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('loginTime', Date.now().toString()); // Thêm dòng này để đánh dấu
  },
};

export default authService;