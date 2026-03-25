import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import wishlistService from "../../../../../services/wishlistService";
import authService from "../../../../../services/authService";
import cartService from "../../../../../services/cartService";
import { message } from "antd";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const handleAddToCart = async () => {
    if (!authService.isLoggedIn()) {
      message.warning({ content: "Vui lòng đăng nhập để mua hàng", key: "cart_auth" });
      return;
    }
    try {
      const res = await cartService.addToCart(product._id, 1);
      if (res.success) {
        message.success({ content: "Đã thêm vào giỏ hàng 🎉", key: "cart_success" });
        window.dispatchEvent(new Event("cartUpdated")); // Cập nhật số lượng trên icon giỏ hàng
      }
    } catch (error) {
      console.error(error);
      message.error({ content: "Không thể thêm vào giỏ hàng", key: "cart_error" });
    }
  };

  const handleBuyNow = async () => {
    if (!authService.isLoggedIn()) {
      message.warning({ content: "Vui lòng đăng nhập để mua hàng", key: "cart_auth" });
      return;
    }
    // Chờ thêm vào giỏ xong rồi chuyển trang
    try {
      const res = await cartService.addToCart(product._id, 1);
      if (res.success) {
        window.dispatchEvent(new Event("cartUpdated"));
        navigate("/cart");
      }
    } catch (error) {
      message.error({ content: "Không thể xử lý mua ngay", key: "cart_error" });
    }
  };

  // Kiểm tra đã có trong wishlist chưa
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const exists = wishlist.find((item) => (item._id || item.id) === product._id);
    if (exists) setLiked(true);
  }, [product._id]);

  const toggleWishlist = async () => {
    if (!authService.isLoggedIn()) {
      message.warning({ content: "Vui lòng đăng nhập để lưu sản phẩm", key: "wishlist_auth" });
      return;
    }
    if (loadingWishlist) return;

    setLoadingWishlist(true);
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    try {
      const res = await wishlistService.toggleWishlist(product._id);
      if (res.success) {
        if (liked) {
          wishlist = wishlist.filter((item) => (item._id || item.id) !== product._id);
          setLiked(false);
          message.success({ content: "Đã xoá khỏi danh sách yêu thích", key: "wishlist" });
        } else {
          wishlist.push(product);
          setLiked(true);
          message.success({ content: "Đã thêm vào danh sách yêu thích", key: "wishlist" });
        }
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        window.dispatchEvent(new Event("wishlistUpdated"));
      }
    } catch (error) {
      console.error(error);
      message.error({ content: "Lỗi khi cập nhật danh sách yêu thích", key: "wishlist" });
    } finally {
      setLoadingWishlist(false);
    }
  };

  const imageUrl = product.images?.[0]?.url || "https://placehold.co/400x400?text=No+Image";

  return (
    <div className="product-card group">

      <div className="image-wrapper">
        {/* Ánh sáng phía sau */}
        <div className="light-glow"></div>

        <Link to={`/product/${product._id}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
          />
        </Link>

        {product.originalPrice > product.price && (
          <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
            -{Math.round((product.originalPrice - product.price) / product.originalPrice * 100)}%
          </div>
        )}

        <button
          onClick={toggleWishlist}
          className="heart-btn relative z-20"
        >
          <Heart
            size={20}
            className={
              liked ? "text-pink-500 fill-pink-500" : "text-pink-400 hover:text-pink-500"
            }
          />
        </button>
      </div>

      <div className="product-content">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
            <Star size={12} className="text-yellow-500 fill-yellow-500" />
            <span className="text-[11px] font-bold text-yellow-700">
              {product.averageRating || 5.0}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Đã bán {product.sold || 0}
          </span>
        </div>

        <Link to={`/product/${product._id}`}>
          <h3 className="product-title line-clamp-2 hover:text-pink-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex flex-col items-center">
          {product.originalPrice > product.price && (
            <p className="old-price">
              {product.originalPrice.toLocaleString()} đ
            </p>
          )}
          <p className="new-price">
            {product.price.toLocaleString()} đ
          </p>
        </div>

        <div className="button-group">
          <button className="btn-buy" onClick={handleBuyNow}>
            Mua ngay
          </button>
          <button className="btn-cart" onClick={handleAddToCart}>
            Thêm vào giỏ
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;