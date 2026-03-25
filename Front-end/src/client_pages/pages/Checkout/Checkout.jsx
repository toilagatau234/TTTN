import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle2, Ticket, Truck } from "lucide-react";
import { message, Select } from "antd";

import cartService from "../../../services/cartService";
import orderService from "../../../services/orderService";
import shippingService from "../../../services/shippingService";
import voucherService from "../../../services/voucherService";
import authService from "../../../services/authService";

const Checkout = () => {
  const navigate = useNavigate();

  // ----- STATES -----
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState(null);

  // Shipping Form
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    street: "",
    province: null,
    district: null,
    ward: null,
    address: "",
    note: "",
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=3")
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(console.error);
  }, []);

  const handleProvinceChange = (value) => {
    const province = provinces.find(p => p.code === value);
    setShippingInfo(prev => ({ ...prev, province, district: null, ward: null, address: "" }));
    setDistricts(province?.districts || []);
    setWards([]);
  };

  const handleDistrictChange = (value) => {
    const district = districts.find(d => d.code === value);
    setShippingInfo(prev => ({ ...prev, district, ward: null, address: "" }));
    setWards(district?.wards || []);
  };

  const handleWardChange = (value) => {
    const ward = wards.find(w => w.code === value);
    setShippingInfo(prev => ({ ...prev, ward, address: "" }));
  };

  // Compute full address dynamically
  useEffect(() => {
    const { street, ward, district, province } = shippingInfo;
    if (street && ward && district && province) {
      setShippingInfo(prev => ({ ...prev, address: `${street}, ${ward.name}, ${district.name}, ${province.name}` }));
    } else {
      setShippingInfo(prev => ({ ...prev, address: "" }));
    }
  }, [shippingInfo.street, shippingInfo.ward, shippingInfo.district, shippingInfo.province]);

  // Carriers
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);

  // Vouchers
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [newOrderCode, setNewOrderCode] = useState("");

  // ----- INITIAL LOAD -----
  useEffect(() => {
    const initCheckout = async () => {
      if (!authService.isLoggedIn()) {
        message.warning("Vui lòng đăng nhập để thanh toán");
        navigate("/login", { state: { from: "/checkout" } });
        return;
      }

      try {
        setLoading(true);
        // 1. Get Cart
        const cartRes = await cartService.getCart();
        if (cartRes.success) {
          if (!cartRes.data || (cartRes.data.items.length === 0 && cartRes.data.customBouquets.length === 0)) {
            message.warning("Giỏ hàng trống, không thể thanh toán");
            navigate("/cart");
            return;
          }
          setCart(cartRes.data);

          // Pre-fill user Info
          const user = authService.getCurrentUser();
          if (user) {
            setShippingInfo(prev => ({
              ...prev,
              fullName: user.name || "",
              phone: user.phone || ""
            }));
          }
        }

        // 2. Get Carriers
        const carrierRes = await shippingService.getCarriers();
        if (carrierRes.success && carrierRes.data.length > 0) {
          const activeCarriers = carrierRes.data.filter(c => c.isActive);
          setCarriers(activeCarriers);
          if (activeCarriers.length > 0) {
            setSelectedCarrier(activeCarriers[0]._id);
          }
        }
      } catch (error) {
        console.error("Lỗi khởi tạo checkout:", error);
        message.error("Có lỗi xảy ra, vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [navigate]);

  // ----- CALCULATE SHIPPING FEE -----
  useEffect(() => {
    const calcFee = async () => {
      if (selectedCarrier && shippingInfo.address.length > 5) {
        try {
          // Tính phí dựa trên hãng và địa chỉ (có thể fake weight=1kg)
          const feeRes = await shippingService.calculateFee({
            carrierId: selectedCarrier,
            shippingAddress: shippingInfo.address,
            weightInGrams: 1000 // Tạm hardcode 1kg
          });
          if (feeRes.success) {
            setShippingFee(feeRes.data.fee ?? 0);
          }
        } catch (error) {
          console.error("Lỗi tính phí ship:", error);
          // Fallback
          setShippingFee(30000);
        }
      } else {
        setShippingFee(0); // Chưa chọn Carrier hoặc chưa nhập Address
      }
    };

    // Debounce nhẹ khi gõ địa chỉ
    const timer = setTimeout(() => {
      calcFee();
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedCarrier, shippingInfo.address]);

  // ----- VOUCHER -----
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;

    try {
      // Calculate true subtotal locally to bypass broken Mongoose totalCartPrice
      const currentSubTotal = (cart?.items || []).reduce((acc, item) => {
        const p = item.isCustom ? (item.price || item.totalCustomPrice || 0) : (item.product?.price || 0);
        return acc + p * (item.quantity || 1);
      }, 0);

      const res = await voucherService.applyVoucher(voucherCode, currentSubTotal);
      if (res.success) {
        setAppliedVoucher(res.data.voucher);
        setDiscountAmount(res.data.discountAmount);
        message.success(`Đã áp dụng mã giảm ${res.data.discountAmount.toLocaleString()}đ`);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Mã giảm giá không hợp lệ");
      setAppliedVoucher(null);
      setDiscountAmount(0);
    }
  };

  const removeVoucher = () => {
    setVoucherCode("");
    setAppliedVoucher(null);
    setDiscountAmount(0);
  };

  // ----- SUBMIT ORDER -----
  const placeOrder = async (e) => {
    e.preventDefault();

    // Validate
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      message.warning("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }
    if (!selectedCarrier) {
      message.warning("Vui lòng chọn đơn vị vận chuyển");
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        shippingInfo,
        paymentMethod,
        shippingFee,
        voucherCode: appliedVoucher?.code,
        carrierId: selectedCarrier
      };

      const res = await orderService.createOrder(orderData);

      if (res.success) {
        setOrderSuccess(true);
        setNewOrderCode(res.data.orderCode);
        message.success("Đặt hàng thành công!");
        window.dispatchEvent(new Event("cartUpdated")); // Update navbar cart count (0)
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      message.error(error?.response?.data?.message || "Lỗi đặt hàng, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- RENDER -----
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-emerald-500">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p>Đang chuẩn bị trang thanh toán...</p>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#fffafc] py-20 flex justify-center px-4">
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl border border-emerald-100 p-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
          <p className="text-gray-500 mb-8">
            Mã đơn hàng của bạn là <span className="font-bold text-emerald-500">{newOrderCode}</span>.
            <br />Shop sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
          <div className="flex gap-4 w-full">
            <Link to="/shop" className="flex-1 bg-pink-50 text-pink-500 font-medium py-3 rounded-xl hover:bg-pink-100 transition">
              Tiếp tục mua sắm
            </Link>
            <Link to="/profile/orders" className="flex-1 bg-emerald-400 text-white font-medium py-3 rounded-xl hover:bg-emerald-500 transition shadow-md">
              Xem đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Tách items
  const regularItems = (cart?.items || []).filter(item => !item.isCustom);
  const customItems = (cart?.items || []).filter(item => item.isCustom);
  
  // Calculate true subtotal locally
  const subTotal = (cart?.items || []).reduce((acc, item) => {
    const p = item.isCustom ? (item.price || item.totalCustomPrice || 0) : (item.product?.price || 0);
    return acc + p * (item.quantity || 1);
  }, 0);

  const finalTotal = subTotal + shippingFee - discountAmount;

  return (
    <div className="bg-[#fffafc] min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/cart" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-pink-50 text-pink-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Thanh toán an toàn</h1>
        </div>

        <form onSubmit={placeOrder} className="grid lg:grid-cols-12 gap-10">

          {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG & THANH TOÁN */}
          <div className="lg:col-span-7 space-y-8">

            {/* THÔNG TIN GIAO HÀNG */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-100">1. Thông tin người nhận</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.fullName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition"
                    placeholder="Nhập họ tên người nhận"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition"
                    placeholder="VD: 0987123xyz"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Tỉnh/Thành phố *</label>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="Chọn Tỉnh/Thành phố"
                    value={shippingInfo.province?.code}
                    onChange={handleProvinceChange}
                    options={provinces.map(p => ({ label: p.name, value: p.code }))}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Quận/Huyện *</label>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="Chọn Quận/Huyện"
                    value={shippingInfo.district?.code}
                    onChange={handleDistrictChange}
                    options={districts.map(d => ({ label: d.name, value: d.code }))}
                    disabled={!shippingInfo.province}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Phường/Xã *</label>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="Chọn Phường/Xã"
                    value={shippingInfo.ward?.code}
                    onChange={handleWardChange}
                    options={wards.map(w => ({ label: w.name, value: w.code }))}
                    disabled={!shippingInfo.district}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Số nhà, Tên đường *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.street}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition"
                    placeholder="VD: 123 Đường Bông Hồng"
                  />
                  {!shippingInfo.address && <p className="text-xs text-amber-500 mt-2">* Nhập đầy đủ 4 phần địa chỉ hệ thống mới tính phí vận chuyển</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Ghi chú cho shipper (Không bắt buộc)</label>
                  <textarea
                    value={shippingInfo.note}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, note: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition resize-none"
                    placeholder="Lưu ý giao hàng, giờ nhận..."
                  />
                </div>
              </div>
            </div>

            {/* VẬN CHUYỂN */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-100 flex justify-between items-center">
                <span>2. Đơn vị vận chuyển</span>
                <Truck className="text-emerald-500" />
              </h2>
              <div className="space-y-3">
                {carriers.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">Chưa có đơn vị vận chuyển khả dụng.</p>
                ) : (
                  carriers.map(carrier => (
                    <label
                      key={carrier._id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${selectedCarrier === carrier._id ? 'border-emerald-400 bg-emerald-50/30' : 'border-gray-100 hover:border-emerald-200'}`}
                    >
                      <div className="flex items-center gap-4 mb-2 sm:mb-0">
                        <input
                          type="radio"
                          name="carrier"
                          value={carrier._id}
                          checked={selectedCarrier === carrier._id}
                          onChange={() => setSelectedCarrier(carrier._id)}
                          className="w-5 h-5 text-emerald-500 focus:ring-emerald-400"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{carrier.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{carrier.description || "Giao hàng tiêu chuẩn"}</p>
                        </div>
                      </div>
                      {selectedCarrier === carrier._id && shippingInfo.address.length > 5 ? (
                        <div className="text-right sm:text-left font-bold text-emerald-600 sm:ml-4">
                          {(shippingFee || 0) === 0 ? "Miễn phí" : `${(shippingFee || 0).toLocaleString()} đ`}
                        </div>
                      ) : (
                        <div className="text-right sm:text-left text-sm text-gray-400 sm:ml-4">
                          {shippingInfo.address.length > 5 ? 'Đang tính...' : 'Cần địa chỉ'}
                        </div>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-100">3. Phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'COD' ? 'border-pink-400 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-pink-500 focus:ring-pink-400"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-sm text-gray-500">Trả tiền mặt khi shipper giao tận tay</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'MOMO' ? 'border-pink-400 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="MOMO"
                    checked={paymentMethod === 'MOMO'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-pink-500 focus:ring-pink-400"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">Ví MoMo</p>
                    <p className="text-sm text-gray-500">Quét mã QR qua ứng dụng MoMo (Test demo M3.3)</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-pink-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Tóm tắt đơn hàng</h2>

              {/* Product List summary */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar mb-6">
                {regularItems.map(item => (
                  <div key={item._id} className="flex gap-4 items-center">
                    <div className="relative">
                      <img src={item.product?.images?.[0]?.url || "https://placehold.co/60"} className="w-16 h-16 object-cover rounded-xl" alt="" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-400 text-white rounded-full flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product?.name}</p>
                      <p className="text-sm text-pink-500 font-bold">{((item.product?.price || 0) * item.quantity).toLocaleString()} đ</p>
                    </div>
                  </div>
                ))}

                {customItems.map((item, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="relative">
                      <img src={item.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-400 text-white rounded-full flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name || `Hoa thiết kế #${i + 1}`}</p>
                      <p className="text-sm text-purple-500 font-bold">{((item.price || 0) * item.quantity).toLocaleString()} đ</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* VOUCHER INPUT */}
              <div className="mb-6">
                {!appliedVoucher ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Mã giảm giá..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 outline-none uppercase text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="bg-gray-800 text-white px-4 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
                    >
                      Áp dụng
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium">
                      <Ticket size={18} />
                      {appliedVoucher.code} <span className="text-sm font-normal">(-{(discountAmount || 0).toLocaleString()}đ)</span>
                    </div>
                    <button onClick={removeVoucher} type="button" className="text-emerald-400 hover:text-emerald-600 text-sm underline">Hủy bỏ</button>
                  </div>
                )}
              </div>

              {/* CALCULATION */}
              <div className="space-y-3 mb-6 text-sm text-gray-600 border-t border-gray-100 pt-6">
                <div className="flex justify-between">
                  <span>Tạm tính ({regularItems.length + customItems.length} sản phẩm)</span>
                  <span className="font-medium text-gray-800">{(subTotal || 0).toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-gray-800">{(shippingFee || 0) === 0 ? "Chưa tính" : `${(shippingFee || 0).toLocaleString()} đ`}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Giảm giá voucher</span>
                    <span>- {(discountAmount || 0).toLocaleString()} đ</span>
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="border-t border-dashed border-gray-200 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-gray-800 font-bold text-lg">Tổng cộng</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-pink-500 block">
                      {Math.max(0, finalTotal).toLocaleString()} đ
                    </span>
                    <span className="text-xs text-gray-400">(Bao gồm VAT nếu có)</span>
                  </div>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-4 rounded-2xl font-bold text-lg transition shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {submitting && <Loader2 size={20} className="animate-spin" />}
                {submitting ? "Đang xử lý đặt hàng..." : `Đặt món (${Math.max(0, finalTotal).toLocaleString()}đ)`}
              </button>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default Checkout;
