import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import cartService from "../../../services/cartService";
import { message } from "antd";

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await cartService.getCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng:", error);
      // Nếu lỗi 401 Unauthorized (chưa đăng nhập), chuyển hướng
      if (error?.response?.status === 401) {
        message.warning("Vui lòng đăng nhập để xem giỏ hàng");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    // TODO: Nên có debounce ở đây để tránh call API liên tục (sẽ làm ở file riêng nếu phức tạp)
    try {
      await cartService.updateQuantity(itemId, newQuantity);
      fetchCart(); // Gọi lại để lấy giá mới và stock validation từ BE
    } catch (error) {
      message.error(error?.response?.data?.message || "Lỗi cập nhật số lượng");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      message.success("Đã xóa khỏi giỏ hàng");
      fetchCart();
    } catch (error) {
      message.error("Lỗi khi xóa sản phẩm");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-pink-400">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p>Đang tải giỏ hàng...</p>
      </div>
    );
  }

  // Tách items thường và items AI custom
  const regularItems = cart?.items || [];
  const customItems = cart?.customBouquets || [];
  const hasItems = regularItems.length > 0 || customItems.length > 0;

  // Tính toán các con số tổng quát
  const originalSubTotal = (cart?.items || []).reduce((acc, item) => {
    const p = item.product?.originalPrice || item.product?.price || 0;
    return acc + p * (item.quantity || 1);
  }, 0);

  const saleSubTotal = (cart?.items || []).reduce((acc, item) => {
    const p = item.product?.price || 0;
    return acc + p * (item.quantity || 1);
  }, 0);

  // Cộng thêm các bó hoa AI (giả định không có giá gốc riêng biệt cho AI custom)
  const customTotal = (cart?.customBouquets || []).reduce((acc, item) => {
    return acc + (item.totalCustomPrice || 0);
  }, 0);

  const finalOriginalTotal = originalSubTotal + customTotal;
  const finalSaleTotal = saleSubTotal + customTotal;
  const totalSavings = finalOriginalTotal - finalSaleTotal;

  return (
    <div className="bg-white min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-500 shadow-sm">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Giỏ Hàng</h1>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">
              Bạn có {regularItems.length + customItems.length} sản phẩm trong giỏ
            </p>
          </div>
        </div>

        {!hasItems ? (
          <div className="bg-neutral-50 rounded-[3rem] p-24 text-center border-2 border-dashed border-neutral-200 flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-premium mb-8">
              <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="w-16 opacity-30" alt="Empty" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">Giỏ hàng đang trống</h2>
            <p className="text-gray-400 mb-10 max-w-sm">Hãy chọn cho mình những nhành hoa tươi thắm nhất để làm rực rỡ không gian của bạn nhé!</p>
            <Link
              to="/shop"
              className="bg-neutral-900 text-white px-10 py-4 rounded-full hover:bg-neutral-800 font-black transition-all shadow-lg active:scale-95 flex items-center gap-3 uppercase tracking-wider text-sm"
            >
              Bắt đầu mua sắm <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-10">
            {/* DANH SÁCH SẢN PHẨM */}
            <div className="lg:col-span-8 space-y-8">

              {/* Hoa Thường */}
              {regularItems.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-premium border border-neutral-100">
                  <div className="flex items-center gap-2 mb-8">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Sản phẩm mẫu</h3>
                  </div>
                  <div className="space-y-8">
                    {regularItems.map((item) => (
                      <div key={item._id} className="flex gap-6 items-center group relative pt-4 first:pt-0">
                        <div className="absolute -top-4 left-0 w-full h-px bg-neutral-50 first:hidden"></div>
                        <div className="relative shrink-0 overflow-hidden rounded-2xl">
                          <img
                            src={item.product?.images?.[0]?.url || "https://placehold.co/100"}
                            alt={item.product?.name}
                            className="w-24 h-24 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.product?._id}`} className="text-lg font-bold text-gray-800 hover:text-pink-500 transition-colors line-clamp-1 block">
                            {item.product?.name || "Sản phẩm đã bị xóa"}
                          </Link>
                          <div className="flex flex-col mt-1">
                            {item.product?.originalPrice > item.product?.price && (
                              <span className="text-[11px] text-gray-400 line-through font-bold">
                                {(item.product.originalPrice || 0).toLocaleString()}đ
                              </span>
                            )}
                            <span className="text-pink-600 font-black text-base leading-tight">
                              {(item.product?.price || 0).toLocaleString()}đ
                            </span>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-1 bg-neutral-100/50 rounded-2xl p-1 border border-neutral-200">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:text-pink-500 text-gray-500 font-black transition-all"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-black text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:text-pink-500 text-gray-500 font-black transition-all"
                          >
                            +
                          </button>
                        </div>

                        {/* Tổng tiền của item */}
                        <div className="w-32 text-right">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Thành tiền</p>
                          <p className="font-black text-[#2B3674] tracking-tighter text-xl leading-none">
                            {((item.product?.price || 0) * (item.quantity || 1)).toLocaleString()}đ
                          </p>
                        </div>

                        {/* Nút xóa */}
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all ml-2"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hoa Thiết Kế (AI) */}
              {customItems.length > 0 && (
                <div className="bg-white rounded-[32px] p-8 shadow-premium border border-neutral-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl opacity-60"></div>
                   <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-200"></span>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">Hoa thiết kế riêng</h3>
                    </div>
                    <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-purple-100 shadow-sm">AI Powered</span>
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                    {customItems.map((item, idx) => (
                      <div key={idx} className="flex gap-6 items-center group relative pt-4 first:pt-0">
                        <div className="absolute -top-4 left-0 w-full h-px bg-neutral-100/50 first:hidden"></div>
                        <div className="relative shrink-0 overflow-hidden rounded-2xl border-2 border-purple-100 shadow-sm">
                          <img
                            src={item.imageUrl}
                            alt="AI Bouquet"
                            className="w-24 h-24 object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-black text-[#1B254B] group-hover:text-purple-700 transition-colors line-clamp-1 block tracking-tight">
                            Bó hoa thiết kế riêng #{idx + 1}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mt-1.5 italic line-clamp-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100/50">
                            "{item.messageContent}"
                          </p>
                          <p className="text-purple-600 font-black mt-2 text-base">
                            {(item.totalCustomPrice || 0).toLocaleString()}đ
                          </p>
                        </div>

                        <div className="w-24 flex flex-col items-center justify-center bg-purple-50 rounded-2xl py-3 px-3 self-center border border-purple-100/50">
                          <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-1">Số lượng</p>
                          <p className="font-black text-purple-700 text-lg">1</p>
                        </div>

                        <div className="w-32 text-right">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Thành tiền</p>
                          <p className="font-black text-[#2B3674] text-xl tracking-tighter leading-none">
                            {(item.totalCustomPrice || 0).toLocaleString()}đ
                          </p>
                        </div>

                        <div className="w-10 h-10 ml-2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* TỔNG KẾT (TÍNH TIỀN) */}
            <div className="lg:col-span-4 h-fit sticky top-24">
              <div className="bg-white rounded-[40px] shadow-premium border border-neutral-100 p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl opacity-60"></div>
                
                <h3 className="text-2xl font-black text-[#1B254B] mb-8 relative z-10 tracking-tight">Chi tiết đơn hàng</h3>

                <div className="space-y-5 mb-8 text-sm relative z-10">
                  <div className="flex justify-between items-center group">
                    <span className="text-gray-600 font-black text-[13px] tracking-tight">Tạm tính ({regularItems.length + customItems.length} sản phẩm)</span>
                    <span className="font-black text-[#1B254B] text-base">{(finalOriginalTotal || 0).toLocaleString()}đ</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-700">
                      <span className="text-gray-600 font-black text-[13px] tracking-tight flex items-center gap-2">
                        Giảm giá shop
                        <span className="bg-emerald-100 text-emerald-600 text-[9px] px-2 py-0.5 rounded-lg font-black tracking-widest">SAVE</span>
                      </span>
                      <span className="font-black text-emerald-500 text-base">-{totalSavings.toLocaleString()}đ</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-black text-[13px] tracking-tight">Mã giảm giá</span>
                    <span className="font-black text-gray-400">0đ</span>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-neutral-100 pt-8 mb-10 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-black text-xl tracking-tight">Tổng cộng</span>
                    <div className="text-right">
                      <span className="text-4xl font-black text-pink-600 block leading-none tracking-tighter">
                        {(finalSaleTotal || 0).toLocaleString()}đ
                      </span>
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-4 block">Đã bao gồm VAT</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="relative group w-full block"
                >
                  <div className="absolute inset-0 bg-neutral-900 rounded-2xl translate-y-2 group-hover:translate-y-1 transition-transform"></div>
                  <div className="relative w-full bg-neutral-800 text-white py-5 rounded-2xl font-black text-center text-lg transition-all transform group-hover:-translate-y-1 group-active:translate-y-1 flex justify-center items-center gap-3 uppercase tracking-wider">
                    Thanh toán <ArrowRight size={20} />
                  </div>
                </Link>
                
                <p className="text-center text-[10px] text-gray-400 mt-6 font-medium uppercase tracking-widest px-4">
                  Phí vận chuyển sẽ được tính ở bước tiếp theo
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;