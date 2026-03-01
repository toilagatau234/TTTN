import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  const [liked, setLiked] = useState(false);

  // Kiểm tra đã có trong wishlist chưa
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const exists = wishlist.find((item) => item.id === product.id);
    if (exists) setLiked(true);
  }, [product.id]);

  const toggleWishlist = () => {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (liked) {
      wishlist = wishlist.filter((item) => item.id !== product.id);
      setLiked(false);
    } else {
      wishlist.push(product);
      setLiked(true);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
  <div className="product-card group">

    <div className="image-wrapper">

      {/* Ánh sáng phía sau */}
      <div className="light-glow"></div>

      <Link to={`/product/${product.id}`} state={{ product }}>
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="product-image"
        />
      </Link>

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

      <Link to={`/product/${product.id}`} state={{ product }}>
        <h3 className="product-title">
          {product.name}
        </h3>
      </Link>

      {product.discount > 0 && (
        <p className="old-price">
          {product.price.toLocaleString()} đ
        </p>
      )}

      <p className="new-price">
        {(
          product.price -
          (product.price * product.discount) / 100
        ).toLocaleString()} đ
      </p>

      <div className="rating-row">
          <span className="star-wrapper">
            <Star size={14} className="star-icon" />
          </span>
          <span className="rating-number">
            {product.rating}
          </span>
          <span className="sold-text">
            | Đã bán {product.sold}
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