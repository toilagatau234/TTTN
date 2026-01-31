import axiosClient from "./axiosClient";

const VOUCHER_ENDPOINT = '/vouchers'; // Backend route

const voucherService = {
  getAll: (params) => {
    return axiosClient.get(VOUCHER_ENDPOINT, { params });
  },
  create: (data) => {
    return axiosClient.post(VOUCHER_ENDPOINT, data);
  },
  update: (id, data) => {
    return axiosClient.put(`${VOUCHER_ENDPOINT}/${id}`, data);
  },
  delete: (id) => {
    return axiosClient.delete(`${VOUCHER_ENDPOINT}/${id}`);
  }
};

export default voucherService;