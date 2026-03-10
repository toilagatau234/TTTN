import axiosClient from './axiosClient';

const wishlistService = {
    // Lấy danh sách wishlist
    getWishlist: () => {
        return axiosClient.get('/wishlist');
    },

    // Thêm/Xoá sản phẩm khỏi wishlist (Toggle)
    toggleWishlist: (productId) => {
        return axiosClient.post('/wishlist', { productId });
    },

    // Xoá cứng một sản phẩm khỏi wishlist
    removeFromWishlist: (productId) => {
        return axiosClient.delete(`/wishlist/${productId}`);
    }
};

export default wishlistService;
