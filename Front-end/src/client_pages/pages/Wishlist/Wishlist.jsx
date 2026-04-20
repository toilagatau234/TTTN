import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Heart, ShoppingBag } from "lucide-react";
import wishlistService from "../../../services/wishlistService";
import authService from "../../../services/authService";
import ProductCard from "../../components/common/user/ProductCard/ProductCard";
import { message } from "antd";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center p-10 text-pink-400">
        <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-pink-50 border-t-pink-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Heart size={20} className="fill-pink-500 text-pink-500 animate-pulse" />
            </div>
        </div>
        <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-400">Đang mở khóa những điều yêu thích...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen shop-wrapper pb-32 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-[500px] bg-pink-50/30 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-nature-soft/20 rounded-full -translate-x-1/2 blur-3xl pointer-events-none"></div>

      {/* Header Section */}
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-nature-primary font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">
            Bộ sưu tập của riêng bạn
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter">
            Sản Phẩm <span className="text-pink-500 italic">Yêu Thích</span> 💖
          </h1>
          <div className="w-24 h-1.5 bg-pink-500/20 mx-auto rounded-full relative overflow-hidden">
             <div className="absolute top-0 left-0 h-full w-12 bg-pink-500 rounded-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-32 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-200 relative group overflow-hidden">
             <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
             <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 rotate-3 transition-transform group-hover:rotate-12 duration-500">
                   <Heart size={40} className="text-pink-200" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">Danh sách trống trơn!</h2>
                <p className="text-gray-400 font-medium mb-10 max-w-sm mx-auto">Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Hãy quay lại cửa hàng để tìm kiếm những bông hoa yêu thích nhé.</p>
                <Link
                to="/shop"
                className="inline-flex items-center gap-3 px-10 py-4 bg-neutral-900 text-white font-black rounded-full hover:bg-neutral-800 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                >
                <ShoppingBag size={18} />
                <span>Khám phá ngay</span>
                </Link>
             </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-10">
                <p className="text-gray-400 font-bold text-sm">
                    Bạn đang có <span className="text-pink-500">{wishlist.length}</span> sản phẩm trong danh sách
                </p>
                <Link to="/shop" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-pink-500 transition-colors flex items-center gap-2">
                    Tiếp tục mua sắm
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {wishlist.map((product) => (
                <div key={product._id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
};

export default Wishlist;