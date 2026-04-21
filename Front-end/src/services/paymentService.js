import axiosClient from "./axiosClient";

const paymentService = {
  verifyVnpayReturn: (search) => {
    const qs = search && search.startsWith("?") ? search : `?${search || ""}`;
    return axiosClient.get(`/payments/vnpay/verify-return${qs}`);
  },
};

export default paymentService;

