import axiosClient from "./axiosClient";

const LOG_ENDPOINT = '/activity-logs';

const activityLogService = {
  getAll: (params) => {
    return axiosClient.get(LOG_ENDPOINT, { params });
  },
  // API xóa toàn bộ log (Dành cho Admin cấp cao muốn dọn dẹp)
  clearAll: () => {
    return axiosClient.delete(LOG_ENDPOINT);
  }
};

export default activityLogService;