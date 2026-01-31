import axiosClient from "./axiosClient";

const authService = {
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },
  
  // Hàm đăng xuất
  logout: () => {
    localStorage.removeItem('user');
  }
};

export default authService;