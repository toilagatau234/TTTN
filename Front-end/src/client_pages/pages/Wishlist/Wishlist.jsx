import { useEffect, useState } from "react";
import { Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import wishlistService from "../../../services/wishlistService";
import cartService from "../../../services/cartService";
import authService from "../../../services/authService";
import { message } from "antd";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  const loadWishlist = async () => {
    if (!authService.isLoggedIn()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await wishlistService.getWishlist();
      if (res.success) {
        setWishlist(res.data?.products || []);
      }
    } catch (error) {
      console.error("Lỗi khi lấy wishlist:", error);
      message.error("Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    window.addEventListener("wishlistUpdated", loadWishlist);
    return () => {
      window.removeEventListener("wishlistUpdated", loadWishlist);
    };
  }, []);

  const removeItem = async (id) => {
    try {
      const res = await wishlistService.removeFromWishlist(id);
      if (res.success) {
        setWishlist(wishlist.filter((item) => item._id !== id));
        window.dispatchEvent(new Event("wishlistUpdated"));
        message.success("Đã xoá khỏi danh sách yêu thích");
      }
    } catch (error) {
      message.error("Lỗi khi xoá sản phẩm khỏi wishlist");
    }
  };

  const clearWishlist = async () => {
    // Không có API clear all, remove the button implementation or loop
    message.warning("Tính năng này đang được cập nhật");
  };

  const handleAddToCart = async (product) => {
    if (!authService.isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để mua hàng");
      return;
    }

    setAddingToCart(product._id);
    try {
      const res = await cartService.addToCart(product._id, 1);
      if (res.success) {
        message.success(`Đã thêm ${product.name} vào giỏ`);
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Lỗi khi thêm vào giỏ hàng");
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#fffafc] min-h-screen flex items-center justify-center p-10 text-pink-400">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p>Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fffafc] min-h-screen shop-wrapper">

      {/* Hoa rơi */}
      <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f1" alt="" />
      <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f2" alt="" />
      <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f3" alt="" />
      <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f4" alt="" />
      <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="floweruy f5" alt="" />

      <div className="relative z-10" />

      {/* Banner */}
      <div className="text-center mb-8 relative">
        <h1 className="text-[#88a82a] font-medium tracking-widest uppercase px-6 pt-6">
          Sản Phẩm Yêu Thích 💗
        </h1>
        <p className="shop-sub">
          Khám phá thêm hoa 🌷
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {wishlist.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-6">
              Bạn chưa có sản phẩm yêu thích 😢
            </p>

            <Link
              to="/shop"
              className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <>
            {/* Nút xoá tất cả */}
            <div className="flex justify-end mb-6">
              <button
                onClick={clearWishlist}
                className="px-6 py-2 bg-rose-300 text-white rounded-full hover:bg-rose-400 transition duration-300 text-sm font-semibold shadow-sm"
              >
                Xoá tất cả
              </button>
            </div>

            {/* LIST sản phẩm */}
            <div className="space-y-6">
              {wishlist.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition"
                >

                  {/* Bên trái */}
                  <div className="flex items-center gap-6">
                    <Link to={`/product/${product._id}`} state={{ product }}>
                      <img
                        src={product.images?.[0]?.url || product.images?.[0]}
                        alt={product.name}
                        className="w-28 h-28 object-cover rounded-xl hover:scale-105 transition"
                      />
                    </Link>

                    <div>
                      <Link to={`/product/${product._id}`} state={{ product }}>
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-pink-500 transition">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-pink-500 font-bold mt-2">
                        {product.price.toLocaleString()} đ
                      </p>
                    </div>
                  </div>
                  {/* Bên phải */}
                  <div className="flex items-center gap-4">

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart === product._id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-300 transition duration-300 text-sm font-medium"                    >
                      {addingToCart === product._id ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                      Thêm vào giỏ
                    </button>

                    <button
                      onClick={() => removeItem(product._id)}
                      className="px-4 py-2 bg-pink-200 text-pink-700 rounded-full hover:bg-pink-300 transition duration-300 text-sm font-medium"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Wishlist;