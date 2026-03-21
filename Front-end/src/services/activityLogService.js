import axiosClient from "./axiosClient";

const LOGS_ENDPOINT = '/logs';

const activityLogService = {
  getAll: (params) => {
    return axiosClient.get(LOGS_ENDPOINT, { params });
  }
};

export default activityLogService;