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

  // Tính lại tổng tiền thay thế biến totalCartPrice ảo từ BE
  const subTotal = (cart?.items || []).reduce((acc, item) => {
    const p = item.isCustom ? (item.price || item.totalCustomPrice || 0) : (item.product?.price || 0);
    return acc + p * (item.quantity || 1);
  }, 0);

  return (
    <div className="bg-[#fffafc] min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center gap-3 mb-10">
          <ShoppingBag className="text-pink-500 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">Giỏ Hàng Của Bạn</h1>
        </div>

        {!hasItems ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-pink-100 flex flex-col items-center">
            <img src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271283/flower_lmks7o.png" className="w-24 mb-6 opacity-50" alt="Empty" />
            <h2 className="text-xl font-medium text-gray-600 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-gray-400 mb-8">Bạn chưa mổ bó hoa nào cả, hãy dạo quanh shop nhé!</p>
            <Link
              to="/shop"
              className="bg-pink-400 text-white px-8 py-3 rounded-full hover:bg-pink-500 font-medium transition shadow-md hover:shadow-lg flex items-center gap-2"
            >
              Tiếp tục mua hàng <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            {/* DANH SÁCH SẢN PHẨM */}
            <div className="lg:col-span-2 space-y-6">

              {/* Hoa Thường */}
              {regularItems.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50">
                  <h3 className="font-semibold text-emerald-500 mb-4 border-b pb-2">Hoa theo mẫu</h3>
                  <div className="space-y-6">
                    {regularItems.map((item) => (
                      <div key={item._id} className="flex gap-4 items-center bg-gray-50/50 p-4 rounded-2xl">
                        <img
                          src={item.product?.images?.[0]?.url || "https://placehold.co/100"}
                          alt={item.product?.name}
                          className="w-24 h-24 object-cover rounded-xl border border-gray-100"
                        />
                        <div className="flex-1">
                          <Link to={`/product/${item.product?._id}`} className="font-medium text-gray-800 hover:text-pink-500 transition line-clamp-1">
                            {item.product?.name || "Sản phẩm đã bị xóa"}
                          </Link>
                          <p className="text-pink-500 font-bold mt-1">
                            {(item.product?.price || 0).toLocaleString()} đ
                          </p>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-3 bg-white border border-pink-100 rounded-full px-2 py-1 shadow-sm">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-50 text-pink-500 font-medium"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-50 text-pink-500 font-medium"
                          >
                            +
                          </button>
                        </div>

                        {/* Tổng tiền của item */}
                        <div className="w-28 text-right font-medium text-gray-700">
                          {((item.product?.price || 0) * (item.quantity || 1)).toLocaleString()} đ
                        </div>

                        {/* Nút xóa */}
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="w-10 h-10 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition"
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
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-50">
                  <h3 className="font-semibold text-purple-500 mb-4 border-b pb-2 flex justify-between items-center">
                    <span>Hoa thiết kế AI (Rosee)</span>
                    <span className="text-xs font-normal text-purple-400 bg-purple-50 px-2 py-1 rounded">Sản phẩm độc quyền</span>
                  </h3>
                  <div className="space-y-6">
                    {customItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-purple-50/30 p-4 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-purple-200"></div>
                        <img
                          src={item.imageUrl}
                          alt="AI Bouquet"
                          className="w-24 h-24 object-cover rounded-xl border border-purple-100"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-purple-800">
                            Bó hoa thiết kế riêng #{idx + 1}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 italic line-clamp-2">
                            "{item.messageContent}"
                          </p>
                          <p className="text-purple-600 font-bold mt-1">
                            {(item.totalCustomPrice || 0).toLocaleString()} đ
                          </p>
                        </div>

                        {/* Note: Hoa AI custom số lượng luôn mặc định là 1 (hoặc theo thiết kế hiện tại) */}
                        <div className="w-24 text-center font-medium text-gray-400 text-sm">
                          SL: 1
                        </div>

                        <div className="w-28 text-right font-medium text-gray-700">
                          {(item.totalCustomPrice || 0).toLocaleString()} đ
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* TỔNG KẾT (TÍNH TIỀN) */}
            <div className="bg-white rounded-3xl shadow-lg border border-pink-100 p-8 h-fit sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Tổng đơn hàng</h3>

              <div className="space-y-4 mb-6 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính ({regularItems.length + customItems.length} loại)</span>
                  <span className="font-medium">
                    {(subTotal || 0).toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>Khuyến mãi</span>
                  <span>0 đ</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-gray-800 font-medium">Tổng cộng</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-pink-500 block">
                      {(subTotal || 0).toLocaleString()} đ
                    </span>
                    <span className="text-xs text-gray-400">(Chưa bao gồm phí vận chuyển)</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-4 rounded-2xl font-bold text-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Tiến hành thanh toán
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;