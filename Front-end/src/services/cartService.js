import axiosClient from "./axiosClient";

const CART_ENDPOINT = '/cart';

const cartService = {
    // Lấy giỏ hàng của user hiện tại
    getCart: () => {
        return axiosClient.get(CART_ENDPOINT);
    },

    // Thêm sản phẩm vào giỏ
    addToCart: (productId, quantity) => {
        return axiosClient.post(CART_ENDPOINT, { productId, quantity });
    },

    // Thêm bó hoa tùy chỉnh (AI generated)
    addCustomBouquet: (messageContent, imageUrl, totalCustomPrice) => {
        return axiosClient.post(`${CART_ENDPOINT}/custom`, {
            messageContent,
            imageUrl,
            totalCustomPrice
        });
    },

    // Cập nhật số lượng
    updateQuantity: (itemId, quantity) => {
        return axiosClient.put(`${CART_ENDPOINT}/${itemId}`, { quantity });
    },

    // Xoá 1 sản phẩm khỏi giỏ
    removeItem: (itemId) => {
        return axiosClient.delete(`${CART_ENDPOINT}/${itemId}`);
    },

    // Xoá toàn bộ giỏ (thường sẽ dùng tự động ở backend khi đặt hàng xong)
    clearCart: () => {
        return axiosClient.delete(CART_ENDPOINT);
    }
};

export default cartService;
