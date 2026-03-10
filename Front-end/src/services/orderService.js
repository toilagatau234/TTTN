import axiosClient from "./axiosClient";

const ORDER_ENDPOINT = '/orders';

const orderService = {
    // Tạo đơn hàng mới từ giỏ hàng hiện tại
    createOrder: (orderData) => {
        return axiosClient.post(ORDER_ENDPOINT, orderData);
    },

    // Lấy danh sách đơn hàng của user hiện tại
    getMyOrders: () => {
        return axiosClient.get(`${ORDER_ENDPOINT}/my`);
    },

    // Lấy chi tiết đơn hàng
    getOrderById: (id) => {
        return axiosClient.get(`${ORDER_ENDPOINT}/${id}`);
    },

    // Hủy đơn hàng
    cancelOrder: (id) => {
        return axiosClient.post(`${ORDER_ENDPOINT}/${id}/cancel`);
    },

    // ============== ADMIN ROUTES =================

    // Lấy tất cả đơn hàng (Admin)
    getAllOrders: (params) => {
        return axiosClient.get(ORDER_ENDPOINT, { params });
    },

    // Admin cập nhật status
    updateOrderStatus: (id, status) => {
        return axiosClient.put(`${ORDER_ENDPOINT}/${id}/status`, { status });
    }
};

export default orderService;
