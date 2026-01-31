import axiosClient from "./axiosClient";

const SHIPPING_ENDPOINT = '/shipping'; // Backend route

const shippingService = {
  // --- CẤU HÌNH ĐỐI TÁC ---
  getCarriers: () => {
    return axiosClient.get(`${SHIPPING_ENDPOINT}/carriers`);
  },
  updateCarrierConfig: (id, data) => {
    return axiosClient.put(`${SHIPPING_ENDPOINT}/carriers/${id}`, data);
  },

  // --- QUẢN LÝ VẬN ĐƠN ---
  getShipments: (params) => {
    return axiosClient.get(`${SHIPPING_ENDPOINT}/shipments`, { params });
  },
  // API đẩy đơn sang hãng vận chuyển (Tạo vận đơn)
  createShipment: (orderId, carrierId) => {
    return axiosClient.post(`${SHIPPING_ENDPOINT}/shipments`, { orderId, carrierId });
  },
  // Đồng bộ trạng thái mới nhất từ hãng
  syncStatus: (trackingCode) => {
    return axiosClient.post(`${SHIPPING_ENDPOINT}/sync`, { trackingCode });
  }
};

export default shippingService;