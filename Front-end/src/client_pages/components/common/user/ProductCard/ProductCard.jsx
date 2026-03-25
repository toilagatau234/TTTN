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
        <Link to={`/product/${product._id}`}>
          <h3 className="product-title line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {product.originalPrice > product.price && (
          <p className="old-price">
            {product.originalPrice.toLocaleString()} đ
          </p>
        )}

        <p className="new-price">
          {product.price.toLocaleString()} đ
        </p>

        <div className="rating-row">
          <span className="star-wrapper">
            <Star size={14} className="star-icon" />
          </span>
          <span className="rating-number">
            {product.averageRating || 5.0}
          </span>
          <span className="sold-text">
            | Đã bán {product.sold || 0}
          </span>
        </div>

        <div className="button-group">
          <button className="btn-cart" onClick={handleAddToCart}>
            Thêm vào giỏ
          </button>

          <button className="btn-buy" onClick={handleBuyNow}>
            Mua ngay
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;