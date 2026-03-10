import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import wishlistService from "../../../../../services/wishlistService";
import authService from "../../../../../services/authService";
import { message } from "antd";

const ProductCard = ({ product }) => {
  const [liked, setLiked] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

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
          <button className="btn-cart">
            Thêm vào giỏ
          </button>

          <button className="btn-buy">
            Mua ngay
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;