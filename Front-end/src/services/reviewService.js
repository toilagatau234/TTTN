import axiosClient from './axiosClient';

const reviewService = {
    // Lấy danh sách đánh giá của 1 sản phẩm
    getProductReviews: (productId, params) => {
        return axiosClient.get(`/reviews/product/${productId}`, { params });
    },

    // Tạo đánh giá mới (Cần đăng nhập)
    addReview: (productId, rating, comment, images) => {
        return axiosClient.post('/reviews', {
            productId,
            rating,
            comment,
            images
        });
    },

    // Cập nhật đánh giá
    updateReview: (id, data) => {
        return axiosClient.put(`/reviews/${id}`, data);
    },

    // Xóa đánh giá
    deleteReview: (id) => {
        return axiosClient.delete(`/reviews/${id}`);
    },

    // Admin: Lấy tất cả đánh giá
    getAllReviews: (params) => {
        return axiosClient.get('/reviews', { params });
    },

    // Admin: Ẩn/Hiện đánh giá
    toggleApprove: (id) => {
        return axiosClient.put(`/reviews/${id}/approve`);
    },

    // Thích đánh giá
    likeReview: (id) => {
        return axiosClient.put(`/reviews/${id}/like`);
    },

    // Admin: Phản hồi đánh giá
    replyReview: (id, reply) => {
        return axiosClient.put(`/reviews/${id}/reply`, { reply });
    }
};

export default reviewService;
