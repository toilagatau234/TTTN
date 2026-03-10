import { useState, useEffect } from "react";
import { Star, Loader2, Heart } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import productService from "../../../services/productService";
import cartService from "../../../services/cartService";
import authService from "../../../services/authService";
import reviewService from "../../../services/reviewService";
import wishlistService from "../../../services/wishlistService";
import ProductCard from "../../components/common/user/ProductCard/ProductCard";
import { message, Rate } from "antd";

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Wishlist and Reviews state
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewParams, setReviewParams] = useState({ page: 1, limit: 5 });
  const [totalReviews, setTotalReviews] = useState(0);

  // New review form state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productService.get(id);
        if (res.success) {
          setProduct(res.data);
          setMainImage(res.data.images?.[0]?.url || "");

          // Sync liked status from local storage
          const localWish = JSON.parse(localStorage.getItem("wishlist")) || [];
          if (localWish.some(item => (item._id || item.id) === id)) {
            setLiked(true);
          } else {
            setLiked(false);
          }

          // Fetch related products
          if (res.data.category?._id) {
            const relatedRes = await productService.getAll({
              category: res.data.category._id,
              limit: 5 // Get 5, will filter out self later to keep 4
            });
            if (relatedRes.success) {
              setRelatedProducts(relatedRes.data);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi lấy chi tiết sản phẩm:", err);
        setError("Không tìm thấy sản phẩm 😢");
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await reviewService.getProductReviews(id, reviewParams);
        if (res.success) {
          setReviews(res.data || []);
          setTotalReviews(res.total || res.data?.length || 0);
        }
      } catch (err) {
        console.error("Lỗi báo cáo:", err);
      }
    };

    if (id) {
      fetchProductDetails();
      fetchReviews();
    }
  }, [id, reviewParams.page]);

  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!authService.isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để mổ hàng");
      navigate("/login");
      return;
    }

    setAddingToCart(true);
    try {
      const res = await cartService.addToCart(product._id, quantity);
      if (res.success) {
        message.success(`Đã thêm ${quantity} x ${product.name} vào giỏ`);
        // Dispatch event để Navbar tự động update số lượng nếu cần
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Lỗi khi thêm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const handleToggleWishlist = async () => {
    if (!authService.isLoggedIn()) {
      message.warning({ content: "Vui lòng đăng nhập để lưu sản phẩm", key: "wishlist" });
      return;
    }
    if (togglingWishlist) return;

    setTogglingWishlist(true);
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
      message.error({ content: "Lỗi khi cập nhật danh sách yêu thích", key: "wishlist" });
    } finally {
      setTogglingWishlist(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!authService.isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để đánh giá sản phẩm");
      return;
    }
    if (!newReviewComment.trim()) {
      message.warning("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await reviewService.addReview(id, newReviewRating, newReviewComment);
      if (res.success) {
        message.success("Cảm ơn bạn đã đánh giá!");
        setNewReviewComment("");
        setNewReviewRating(5);
        // Refresh reviews
        const refreshRes = await reviewService.getProductReviews(id, reviewParams);
        if (refreshRes.success) {
          setReviews(refreshRes.data || []);
          setTotalReviews(refreshRes.total || refreshRes.data?.length || 0);
        }
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 text-pink-400">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p>Đang tải hoa xinh...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 text-center text-gray-500 text-xl font-medium">
        {error || "Không tìm thấy sản phẩm 😢"}
      </div>
    );
  }

  // Filter out self, get exactly 4 related
  const filteredRelated = relatedProducts.filter(p => p._id !== product._id).slice(0, 4);

  return (
    <div className="bg-[#fffafc] min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">

        {/* IMAGE SECTION */}
        <div>
          <div className="rounded-3xl overflow-hidden shadow-lg mb-6 border border-pink-100">
            <img
              src={mainImage || "https://placehold.co/600x600?text=No+Image"}
              alt={product.name}
              className="w-full h-[500px] object-cover"
            />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.images?.map((img, index) => (
              <img
                key={index}
                src={img.url}
                alt=""
                onClick={() => setMainImage(img.url)}
                className={`w-24 h-24 object-cover rounded-xl cursor-pointer border-2 transition-all ${mainImage === img.url
                  ? "border-pink-500 scale-105"
                  : "border-transparent opacity-80 hover:opacity-100"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* INFO SECTION */}
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <p className="text-pink-500 text-3xl font-bold">
              {product.price.toLocaleString()} đ
            </p>
            {product.originalPrice > product.price && (
              <p className="text-gray-400 text-xl font-medium line-through">
                {product.originalPrice.toLocaleString()} đ
              </p>
            )}
            {product.originalPrice > product.price && (
              <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm font-bold">
                -{Math.round((product.originalPrice - product.price) / product.originalPrice * 100)}%
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-6 text-lg leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          <p className="text-sm text-pink-500 mb-6 font-medium bg-pink-50 inline-block px-4 py-2 rounded-full">
            Danh mục: {product.category?.name || "Khác"}
          </p>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
              <span className="text-yellow-400">★</span>
              <span className="text-gray-700 font-medium">
                {product.averageRating || 5.0}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="text-emerald-400">✔</span>
              <span className="text-gray-600">
                {product.sold || 0} đã bán
              </span>
            </div>

            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <span className="text-blue-500">Kho: {product.stock > 0 ? product.stock : "Hết hàng"}</span>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-emerald-500 mb-4">
              Chính sách của shop
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-3 border border-gray-50">
                <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-pink-200 text-pink-400 font-bold">✓</div>
                <p className="text-gray-600 text-sm">Cam kết hoa tươi 100%</p>
              </div>
              <div className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-3 border border-gray-50">
                <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-pink-200 text-pink-400 font-bold">✓</div>
                <p className="text-gray-600 text-sm">Hoàn tiền nếu sản phẩm lỗi</p>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mt-8 mb-6">
            <span className="text-gray-600 font-medium">Số lượng:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border-2 border-pink-200 text-pink-500 hover:bg-pink-50 transition font-bold text-lg"
              >
                -
              </button>
              <span className="text-lg font-bold text-gray-800 w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className="w-10 h-10 rounded-full border-2 border-pink-200 text-pink-500 hover:bg-pink-50 transition font-bold text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
              className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {addingToCart && <Loader2 size={20} className="animate-spin" />}
              {product.stock > 0 ? (addingToCart ? "Đang thêm..." : "Thêm vào giỏ") : "Hết hàng"}
            </button>
            <button
              onClick={handleToggleWishlist}
              disabled={togglingWishlist}
              className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition ${liked ? 'border-pink-500 bg-pink-50 text-pink-500' : 'border-pink-200 text-pink-400 hover:bg-pink-50 hover:text-pink-500'}`}
            >
              <Heart size={24} className={liked ? 'fill-pink-500' : ''} />
            </button>
          </div>

        </div>
      </div>

      {/* RATING SECTION */}
      <div className="max-w-7xl mx-auto mt-20">
        <h2 className="text-emerald-400 text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 p-10">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Left summary */}
            <div className="md:col-span-1 border-r border-gray-100 pr-8">
              <div className="text-center">
                <p className="text-6xl font-bold text-pink-500 mb-2">{product.averageRating?.toFixed(1) || "5.0"}</p>
                <div className="mb-2">
                  <Rate disabled defaultValue={product.averageRating || 5} className="text-yellow-400 text-2xl" />
                </div>
                <p className="text-gray-500">{totalReviews} đánh giá</p>
              </div>

              {/* Form đánh giá (nếu đã đăng nhập) */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-4 text-center">Gửi Đánh Giá Của Bạn</h3>
                {authService.isLoggedIn() ? (
                  <form onSubmit={submitReview} className="space-y-4">
                    <div className="text-center">
                      <Rate value={newReviewRating} onChange={setNewReviewRating} className="text-yellow-400 text-xl" />
                    </div>
                    <textarea
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Sản phẩm tuyệt vời..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 min-h-[100px] text-sm"
                      required
                    ></textarea>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-emerald-400 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                      {submittingReview && <Loader2 size={18} className="animate-spin" />}
                      Gửi đánh giá
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-600">
                    Bạn cần <a href="/login" className="text-pink-500 font-semibold hover:underline">đăng nhập</a> để đánh giá.
                  </div>
                )}
              </div>
            </div>

            {/* Right List */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-4">Đánh giá mới nhất</h3>
              {reviews.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 italic">Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={review._id || index} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold uppercase">
                            {(review.user?.name || review.name || "U")[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{review.user?.name || review.name || "Khách hàng"}</p>
                            <Rate disabled defaultValue={review.rating} className="text-yellow-400 text-xs mt-1" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : review.date}
                        </p>
                      </div>
                      <p className="text-gray-600 text-sm pl-13 mt-2 whitespace-pre-line leading-relaxed">
                        {review.comment || review.content}
                      </p>
                    </div>
                  ))}

                  {/* Pagination if needed */}
                  {totalReviews > reviews.length && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => setReviewParams(p => ({ ...p, limit: p.limit + 5 }))}
                        className="text-pink-500 font-medium text-sm hover:underline"
                      >
                        Xem thêm đánh giá
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {filteredRelated.length > 0 && (
        <div className="max-w-7xl mx-auto mt-20">
          <h2 className="text-emerald-400 text-2xl font-bold mb-10 text-center">
            Có thể bạn cũng thích 🌸
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredRelated.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;