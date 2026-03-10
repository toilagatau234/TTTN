import axiosClient from './axiosClient';

const reviewService = {
    // Lấy danh sách đánh giá của 1 sản phẩm
    getProductReviews: (productId, params) => {
        return axiosClient.get(`/products/${productId}/reviews`, { params });
    },

    // Tạo đánh giá mới (Cần đăng nhập)
    addReview: (productId, rating, comment) => {
        return axiosClient.post('/reviews', {
            product: productId,
            rating,
            comment
        });
    }
};

export default reviewService;
