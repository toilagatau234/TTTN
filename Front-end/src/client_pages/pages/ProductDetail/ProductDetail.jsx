import { useState, useEffect } from "react";
import { Star, Loader2, Heart } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import productService from "../../../services/productService";
import cartService from "../../../services/cartService";
import authService from "../../../services/authService";
import reviewService from "../../../services/reviewService";
import wishlistService from "../../../services/wishlistService";
import ProductCard from "../../components/common/user/ProductCard/ProductCard";
import { message, Rate, Progress, Upload, Modal } from "antd";
import { CheckCircleOutlined, PlusOutlined, LikeOutlined, LikeFilled } from "@ant-design/icons";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

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
              limit: 9 // Get 9, will filter out self later to keep 8
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
          setTotalReviews(res.pagination?.total || res.data?.length || 0);
          setCanReview(res.canReview);
          setUserReview(res.userReview);
          if (res.ratingBreakdown) setRatingBreakdown(res.ratingBreakdown);
        }
      } catch (err) {
        console.error("Lỗi lấy đánh giá:", err);
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
      const images = fileList
        .filter(f => f.status === 'done')
        .map(f => ({ url: f.response?.imageUrl || f.url, publicId: f.response?.publicId || f.uid }));

      let res;
      if (editingReviewId) {
        res = await reviewService.updateReview(editingReviewId, {
          rating: newReviewRating,
          comment: newReviewComment,
          images: images
        });
      } else {
        res = await reviewService.addReview(id, newReviewRating, newReviewComment, images);
      }

      if (res.success) {
        message.success(editingReviewId ? "Đã cập nhật đánh giá!" : "Cảm ơn bạn đã đánh giá!");
        setNewReviewComment("");
        setNewReviewRating(5);
        setEditingReviewId(null);
        setFileList([]);
        // Refresh reviews
        const refreshRes = await reviewService.getProductReviews(id, reviewParams);
        if (refreshRes.success) {
          setReviews(refreshRes.data || []);
          setTotalReviews(refreshRes.pagination?.total || refreshRes.data?.length || 0);
          setCanReview(refreshRes.canReview);
          setUserReview(refreshRes.userReview);
          if (refreshRes.ratingBreakdown) setRatingBreakdown(refreshRes.ratingBreakdown);
        }
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setNewReviewRating(review.rating);
    setNewReviewComment(review.comment);
    window.scrollTo({ top: document.getElementById('review-form')?.offsetTop - 100, behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    try {
      const res = await reviewService.deleteReview(reviewId);
      if (res.success) {
        message.success("Đã xóa đánh giá");
        // Refresh
        const refreshRes = await reviewService.getProductReviews(id, reviewParams);
        if (refreshRes.success) {
          setReviews(refreshRes.data || []);
          setTotalReviews(refreshRes.pagination?.total || refreshRes.data?.length || 0);
          setCanReview(refreshRes.canReview);
          setUserReview(refreshRes.userReview);
          if (refreshRes.ratingBreakdown) setRatingBreakdown(refreshRes.ratingBreakdown);
        }
      }
    } catch (error) {
      message.error("Lỗi khi xóa đánh giá");
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!authService.isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để thích đánh giá này");
      return;
    }
    try {
      const res = await reviewService.likeReview(reviewId);
      if (res.success) {
        // Cập nhật state reviews local để UX mượt mà
        setReviews(prev => prev.map(r => {
          if (r._id === reviewId) {
            const userId = authService.getCurrentUser()?._id;
            let newLikes = [...(r.likes || [])];
            if (res.data.isLiked) {
              if (!newLikes.includes(userId)) newLikes.push(userId);
            } else {
              newLikes = newLikes.filter(id => id !== userId);
            }
            return { ...r, likes: newLikes };
          }
          return r;
        }));
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handlePreview = async (file) => {
    setPreviewImage(file.url || file.preview || file.response?.imageUrl);
    setPreviewOpen(true);
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

  // Filter out self, get exactly 8 related
  const filteredRelated = relatedProducts.filter(p => p._id !== id).slice(0, 8);

  const carouselSettings = {
    dots: true,
    infinite: filteredRelated.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, slidesToScroll: 1 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2, slidesToScroll: 1 }
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1, slidesToScroll: 1 }
      }
    ]
  };

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
                {product.averageRating > 0 ? (Math.round(product.averageRating * 10) / 10).toFixed(1) : "0.0"}
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

      {/* RELATED PRODUCTS - Moved up for better discovery */}
      {filteredRelated.length > 0 && (
        <div className="max-w-7xl mx-auto mt-20 mb-20">
          <div className="text-center mb-12">
            <span className="text-nature-primary font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">
                Khám phá thêm
            </span>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
                Có thể bạn <span className="text-pink-500 italic">cũng thích</span> 🌸
            </h2>
            <div className="w-24 h-1.5 bg-pink-500/20 mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="px-2">
            {filteredRelated.length > 4 ? (
              <Slider {...carouselSettings}>
                {filteredRelated.map((item) => (
                  <div key={item._id} className="px-4 pb-12">
                    <ProductCard product={item} />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {filteredRelated.map((item) => (
                  <ProductCard key={item._id} product={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RATING SECTION */}
      <div className="max-w-7xl mx-auto mt-20">
        <h2 className="text-emerald-400 text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 p-10">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Left summary */}
            <div className="md:col-span-1 border-r border-gray-100 pr-8">
              <div className="text-center mb-8">
                <p className="text-6xl font-bold text-pink-500 mb-2">{product.averageRating?.toFixed(1) || "0.0"}</p>
                <div className="mb-2">
                  <Rate disabled value={product.averageRating || 0} className="text-yellow-400 text-2xl" />
                </div>
                <p className="text-gray-500">{totalReviews} đánh giá</p>
              </div>

              {/* Rating breakdown */}
              <div className="space-y-3 mb-8">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3 text-sm group">
                    <div className="flex items-center gap-1 w-12">
                       <span className="font-bold text-gray-700">{star}</span>
                       <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 transition-all duration-1000 ease-out rounded-full" 
                        style={{ width: `${totalReviews > 0 ? (ratingBreakdown[star] / totalReviews) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-gray-400 text-right font-medium group-hover:text-pink-500 transition-colors">
                        {ratingBreakdown[star] || 0}
                    </span>
                  </div>
                ))}
              </div>

              {/* Form đánh giá */}
              <div id="review-form" className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-4 text-center">
                  {editingReviewId ? "Chỉnh sửa đánh giá" : "Gửi Đánh Giá Của Bạn"}
                </h3>
                {authService.isLoggedIn() ? (
                  canReview || editingReviewId ? (
                    <form onSubmit={submitReview} className="space-y-4">
                      <div className="text-center">
                        <Rate value={newReviewRating} onChange={setNewReviewRating} className="text-yellow-400 text-xl" />
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">Đính kèm ảnh (Tối đa 3):</p>
                        <Upload
                          action={`${import.meta.env.VITE_API_URL}/upload`}
                          headers={{ Authorization: `Bearer ${authService.getToken()}` }}
                          listType="picture-card"
                          fileList={fileList}
                          onPreview={handlePreview}
                          onChange={({ fileList }) => setFileList(fileList)}
                          name="image"
                          maxCount={3}
                        >
                          {fileList.length >= 3 ? null : (
                            <div>
                              <PlusOutlined />
                              <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                          )}
                        </Upload>
                      </div>

                      <textarea
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Sản phẩm tuyệt vời..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 min-h-[100px] text-sm"
                        required
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="flex-1 bg-emerald-400 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        >
                          {submittingReview && <Loader2 size={18} className="animate-spin" />}
                          {editingReviewId ? "Cập nhật" : "Gửi đánh giá"}
                        </button>
                        {editingReviewId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReviewId(null);
                              setNewReviewComment("");
                              setNewReviewRating(5);
                            }}
                            className="px-4 py-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </form>
                  ) : userReview ? (
                    <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-xl">
                          <CheckCircleOutlined />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Cảm ơn bạn đã đánh giá!</p>
                          <p className="text-gray-500 text-xs mt-1">Sự góp ý của bạn giúp shop hoàn thiện hơn mỗi ngày.</p>
                        </div>
                        <button 
                          onClick={handleAddToCart}
                          className="w-full bg-emerald-400 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                        >
                          Mua lại sản phẩm này {addingToCart && <Loader2 size={16} className="animate-spin" />}
                        </button>
                        <button 
                          onClick={() => handleEditReview(userReview)}
                          className="text-pink-400 text-xs font-medium hover:underline"
                        >
                          Chỉnh sửa đánh giá của bạn
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-600">
                      Bạn cần mua sản phẩm này để có thể gửi đánh giá.
                    </div>
                  )
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
                          <img 
                            src={review.user?.avatar || "https://i.pravatar.cc/150?u=" + review.user?._id}
                            className="w-10 h-10 rounded-full object-cover border border-pink-100"
                            alt=""
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-800">{review.user?.name || "Khách hàng"}</p>
                              {review.order && (
                                <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                  <CheckCircleOutlined style={{ fontSize: '10px' }} /> Đã mua hàng
                                </span>
                              )}
                            </div>
                            <Rate disabled value={review.rating} className="text-yellow-400 text-[10px] mt-1" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : review.date}
                          </p>
                          {authService.getCurrentUser()?._id === review.user?._id && (
                            <div className="flex gap-2 mt-2 justify-end">
                              <button 
                                onClick={() => handleEditReview(review)}
                                className="text-xs text-blue-500 hover:underline"
                              >
                                Sửa
                              </button>
                              <button 
                                onClick={() => handleDeleteReview(review._id)}
                                className="text-xs text-red-400 hover:underline"
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm pl-13 mt-2 whitespace-pre-line leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3 pl-13">
                          {review.images.map((img, i) => (
                            <img 
                              key={i} 
                              src={img.url} 
                              className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition" 
                              alt="review"
                              onClick={() => {
                                setPreviewImage(img.url);
                                setPreviewOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Helpful Button */}
                      <div className="pl-13 mt-4 flex items-center gap-4">
                        <button 
                          onClick={() => handleLikeReview(review._id)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                            review.likes?.includes(authService.getCurrentUser()?._id)
                              ? 'bg-pink-50 border-pink-200 text-pink-500'
                              : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-pink-200 hover:text-pink-500'
                          }`}
                        >
                          {review.likes?.includes(authService.getCurrentUser()?._id) ? <LikeFilled /> : <LikeOutlined />}
                          Hữu ích ({review.likes?.length || 0})
                        </button>
                      </div>

                      {/* Merchant Reply */}
                      {review.reply && (
                        <div className="ml-13 mt-4 bg-gray-50 p-4 rounded-2xl border-l-4 border-emerald-400 relative">
                          <div className="absolute -top-2 left-4 bg-emerald-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Phản hồi từ shop</div>
                          <p className="text-gray-600 text-xs italic leading-relaxed">
                            "{review.reply}"
                          </p>
                          <p className="text-[10px] text-gray-400 mt-2">
                            {new Date(review.repliedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      )}
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

      {/* Modal preview ảnh */}
      <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)} centered>
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default ProductDetail;