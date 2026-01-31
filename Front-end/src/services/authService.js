import axiosClient from "./axiosClient";

const authService = {
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  }
};
export default authService;