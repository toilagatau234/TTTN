import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle2, Ticket, Truck, CreditCard } from "lucide-react";
import { message, Select } from "antd";

import cartService from "../../../services/cartService";
import orderService from "../../../services/orderService";
import shippingService from "../../../services/shippingService";
import voucherService from "../../../services/voucherService";
import authService from "../../../services/authService";
import userService from "../../../services/userService";

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

  // 1. Fetch Provinces once on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/?depth=3");
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error("Lỗi tải danh mục Tỉnh/Thành:", err);
      }
    };
    fetchProvinces();
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

          // 1.5. Pre-fill user Info from Profile
        try {
          // Wait for provinces if not yet loaded
          let currentProvinces = provinces;
          if (currentProvinces.length === 0) {
             const res = await fetch("https://provinces.open-api.vn/api/?depth=3");
             currentProvinces = await res.json();
             setProvinces(currentProvinces);
          }

          const profileRes = await userService.getProfile();
          if (profileRes.success && profileRes.data) {
            const u = profileRes.data;
            const newShippingInfo = {
              ...shippingInfo,
              fullName: u.name || "",
              phone: u.phone || ""
            };

            // Try to parse structured address: street - ward - district - city
            if (u.address && u.address.includes(" - ")) {
              const parts = u.address.split(" - ").map(p => p.trim());
              console.log("Auto-fill Debug - Raw Address:", u.address);
              console.log("Auto-fill Debug - Split Parts:", parts);
              
              // Define normalization helper locally for consistency
              const normalize = (str) => {
                if (!str) return "";
                return str.toLowerCase()
                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa dấu
                  .replace(/đ/g, "d")
                  .replace(/^(thanh pho|tinh|quan|huyen|phuong|xa|thi tran|tp|tp\.|q\.|h\.|p\.|x\.)\s+/g, "")
                  .trim();
              };

              // Identify parts based on suffix/context if possible, or use order from Profile.jsx (street - ward - district - city)
              // If we have 4 parts, assume the order from Profile.jsx
              if (parts.length === 4) {
                 const [street, wardName, districtName, cityName] = parts;
                 newShippingInfo.street = street;

                 // 1. Match Province
                 const normCity = normalize(cityName);
                 const foundProvince = currentProvinces.find(p => {
                   const pName = normalize(p.name);
                   return pName.includes(normCity) || normCity.includes(pName);
                 });

                 if (foundProvince) {
                   newShippingInfo.province = foundProvince;
                   const ds = foundProvince.districts || [];
                   setDistricts(ds);

                   // 2. Match District
                   const normDistrict = normalize(districtName);
                   const foundDistrict = ds.find(d => {
                     const dName = normalize(d.name);
                     return dName.includes(normDistrict) || normDistrict.includes(dName);
                   });

                   if (foundDistrict) {
                     newShippingInfo.district = foundDistrict;
                     const ws = foundDistrict.wards || [];
                     setWards(ws);

                     // 3. Match Ward
                     const normWard = normalize(wardName);
                     const foundWard = ws.find(w => {
                       const wName = normalize(w.name);
                       return wName.includes(normWard) || normWard.includes(wName);
                     });

                     if (foundWard) {
                        newShippingInfo.ward = foundWard;
                     }
                   }
                 }
              } else {
                // Flexible matching for 2 or 3 parts
                // Usually [ward, district, city] or [street, city] etc.
                // We'll just put the first part in street and try to match others
                newShippingInfo.street = parts[0];
                
                // Try to find if any part matches a province
                for (let i = 0; i < parts.length; i++) {
                  const pNorm = normalize(parts[i]);
                  const fProvince = currentProvinces.find(p => {
                    const pName = normalize(p.name);
                    return pName.includes(pNorm) || pNorm.includes(pName);
                  });

                  if (fProvince) {
                    console.log("Auto-fill Debug - Flexible Match - Found Province:", fProvince.name);
                    newShippingInfo.province = fProvince;
                    const ds = fProvince.districts || [];
                    setDistricts(ds);
                    
                    // Try to match district from other parts
                    for (let j = 0; j < parts.length; j++) {
                      if (i === j) continue;
                      const dNorm = normalize(parts[j]);
                      const fDistrict = ds.find(d => {
                        const dName = normalize(d.name);
                        return dName.includes(dNorm) || dNorm.includes(dName);
                      });
                      if (fDistrict) {
                         console.log("Auto-fill Debug - Flexible Match - Found District:", fDistrict.name);
                         newShippingInfo.district = fDistrict;
                         const ws = fDistrict.wards || [];
                         setWards(ws);

                         // Try to match ward from remaining parts
                         for (let k = 0; k < parts.length; k++) {
                           if (k === i || k === j) continue;
                           const wNorm = normalize(parts[k]);
                           const fWard = ws.find(w => {
                             const wName = normalize(w.name);
                             return wName.includes(wNorm) || wNorm.includes(wName);
                           });
                           if (fWard) {
                              console.log("Auto-fill Debug - Flexible Match - Found Ward:", fWard.name);
                              newShippingInfo.ward = fWard;
                              break;
                           }
                         }
                         break;
                      }
                    }
                    break; 
                  }
                }
                
                // If we didn't match a province, or just want to ensure street is filled
                if (!newShippingInfo.ward && parts.length > 0) {
                   // If not all 4 parts matched perfectly, put the first part in street as a guess
                   if (newShippingInfo.province) {
                      // If we found a province, the street is likely everything else
                      // But for simplicity, we'll keep the first part
                      newShippingInfo.street = parts[0];
                   }
                }
              }
            } else if (u.address) {
              newShippingInfo.street = u.address;
            }

            setShippingInfo(newShippingInfo);
          }
        } catch (profileErr) {
            console.error("Lỗi lấy thông tin profile:", profileErr);
            // Fallback to basic current user if profile fetch fails
            const basicUser = authService.getCurrentUser();
            if (basicUser) {
              setShippingInfo(prev => ({
                ...prev,
                fullName: basicUser.name || "",
                phone: basicUser.phone || ""
              }));
            }
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
        setAppliedVoucher({ code: res.data.code, _id: res.data.voucherId });
        setDiscountAmount(res.data.discount || 0);
        message.success(`Đã áp dụng mã giảm ${(res.data.discount || 0).toLocaleString()}đ`);
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
        shippingInfo: {
          ...shippingInfo,
          ward: shippingInfo.ward?.name || "",
          district: shippingInfo.district?.name || "",
          city: shippingInfo.province?.name || "",
        },
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
            {/* THÔNG TIN GIAO HÀNG */}
            <div className="bg-white rounded-3xl p-8 shadow-premium border border-neutral-100 relative overflow-hidden group hover:border-pink-200 transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm">1</span>
                <span>Thông tin người nhận</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.fullName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all placeholder:text-gray-300"
                    placeholder="Nhập họ tên người nhận"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all placeholder:text-gray-300"
                    placeholder="VD: 0987123xyz"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Tỉnh/Thành phố *</label>
                  <Select
                    className="w-full premium-select"
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Quận/Huyện *</label>
                  <Select
                    className="w-full premium-select"
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Phường/Xã *</label>
                  <Select
                    className="w-full premium-select"
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Số nhà, Tên đường *</label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.street}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all placeholder:text-gray-300"
                    placeholder="VD: 123 Đường Bông Hồng"
                  />
                  {!shippingInfo.address && <p className="text-[11px] text-amber-500 font-medium mt-3 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                    Hệ thống sẽ tính phí vận chuyển sau khi bạn nhập đủ địa chỉ
                  </p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Ghi chú cho shipper (Không bắt buộc)</label>
                  <textarea
                    value={shippingInfo.note}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, note: e.target.value })}
                    rows={3}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all resize-none placeholder:text-gray-300"
                    placeholder="Lưu ý giao hàng, giờ nhận..."
                  />
                </div>
              </div>
            </div>

            {/* VẬN CHUYỂN */}
            <div className="bg-white rounded-3xl p-8 shadow-premium border border-neutral-100 hover:border-emerald-200 transition-all">
              <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">2</span>
                <span>Đơn vị vận chuyển</span>
                <Truck size={20} className="text-emerald-500 ml-auto" />
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {carriers.length === 0 ? (
                  <p className="text-gray-400 italic text-sm py-4">Chưa có đơn vị vận chuyển khả dụng.</p>
                ) : (
                  carriers.map(carrier => (
                    <label
                      key={carrier._id}
                      className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedCarrier === carrier._id ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-50' : 'border-gray-50 hover:border-emerald-200 hover:bg-gray-50/30'}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                          <Truck size={20} className={selectedCarrier === carrier._id ? 'text-emerald-500' : 'text-gray-400'} />
                        </div>
                        <input
                          type="radio"
                          name="carrier"
                          value={carrier._id}
                          checked={selectedCarrier === carrier._id}
                          onChange={() => setSelectedCarrier(carrier._id)}
                          className="w-5 h-5 text-emerald-500 focus:ring-emerald-400 transition-all border-gray-300"
                        />
                      </div>
                      <div className="mt-auto">
                        <p className="font-bold text-gray-800">{carrier.name}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{carrier.description || "Giao hàng tiêu chuẩn"}</p>
                        
                        <div className="mt-4 pt-4 border-t border-emerald-100/50">
                          {selectedCarrier === carrier._id && shippingInfo.address.length > 5 ? (
                            <span className="font-black text-emerald-600">
                              {(shippingFee || 0) === 0 ? "Miễn phí" : `${(shippingFee || 0).toLocaleString()}đ`}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tighter">
                              {shippingInfo.address.length > 5 ? 'Đang tính phí...' : 'Nhập địa chỉ'}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-3xl p-8 shadow-premium border border-neutral-100 hover:border-pink-200 transition-all">
              <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">3</span>
                <span>Phương thức thanh toán</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className={`flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-pink-500 bg-pink-50/50 ring-4 ring-pink-50' : 'border-gray-50 hover:border-pink-200 hover:bg-gray-50/30'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <CreditCard size={20} className={paymentMethod === 'COD' ? 'text-pink-500' : 'text-gray-400'} />
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-pink-500 focus:ring-pink-400 transition-all border-gray-300"
                    />
                  </div>
                  <p className="font-bold text-gray-800">Tiền mặt (COD)</p>
                  <p className="text-xs text-gray-400 mt-1">Trả tiền khi nhận hoa</p>
                </label>

                <label className={`flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'MOMO' ? 'border-pink-500 bg-pink-50/50 ring-4 ring-pink-50' : 'border-gray-50 hover:border-pink-200 hover:bg-gray-50/30'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#A50064] font-black text-xs">
                      MOMO
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      value="MOMO"
                      checked={paymentMethod === 'MOMO'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-pink-500 focus:ring-pink-400 transition-all border-gray-300"
                    />
                  </div>
                  <p className="font-bold text-gray-800">Ví MoMo</p>
                  <p className="text-xs text-gray-400 mt-1">Thanh toán nhanh qua QR</p>
                </label>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-[2rem] p-8 shadow-premium border border-neutral-100 sticky top-24 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl opacity-60"></div>
              
              <h2 className="text-2xl font-black text-gray-800 mb-8 relative z-10">Tóm tắt đơn hàng</h2>

              {/* Product List summary */}
              <div className="space-y-5 max-h-[400px] overflow-y-auto pr-3 mb-8 custom-scrollbar relative z-10">
                {regularItems.map(item => (
                  <div key={item._id} className="flex gap-4 items-center group">
                    <div className="relative shrink-0">
                      <img src={item.product?.images?.[0]?.url || "https://placehold.co/60"} className="w-14 h-14 object-cover rounded-2xl shadow-sm group-hover:scale-105 transition-transform" alt="" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 line-clamp-1">{item.product?.name}</p>
                      <p className="text-sm text-pink-500 font-extrabold mt-0.5">{((item.product?.price || 0) * item.quantity).toLocaleString()}đ</p>
                    </div>
                  </div>
                ))}

                {customItems.map((item, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <div className="relative shrink-0">
                      <img src={item.image} className="w-14 h-14 object-cover rounded-2xl shadow-sm group-hover:scale-105 transition-transform border-2 border-purple-100" alt="" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 line-clamp-1">{item.name || `Thiết kế riêng #${i + 1}`}</p>
                      <p className="text-sm text-purple-600 font-extrabold mt-0.5">{((item.price || 0) * item.quantity).toLocaleString()}đ</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* VOUCHER INPUT */}
              <div className="mb-8 relative z-10">
                {!appliedVoucher ? (
                  <div className="flex gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-pink-200 transition-colors">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Mã giảm giá..."
                        className="w-full bg-transparent pl-10 pr-4 py-2.5 outline-none uppercase text-xs font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-normal"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="bg-neutral-800 text-white px-5 rounded-xl text-xs font-black hover:bg-neutral-700 transition active:scale-95 shadow-sm"
                    >
                      ÁP DỤNG
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl group animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Ticket size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">Đã áp dụng</p>
                        <p className="text-sm font-black text-emerald-700 uppercase">{appliedVoucher.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">-{discountAmount.toLocaleString()}đ</p>
                      <button onClick={removeVoucher} type="button" className="text-[10px] text-emerald-400 hover:text-emerald-600 font-bold underline transition-colors">HỦY BỎ</button>
                    </div>
                  </div>
                )}
              </div>

              {/* CALCULATION */}
              <div className="space-y-4 mb-8 text-sm relative z-10 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium tracking-tight">Tạm tính ({regularItems.length + customItems.length} sản phẩm)</span>
                  <span className="font-bold text-gray-800">{(subTotal || 0).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium tracking-tight">Phí vận chuyển</span>
                  <span className="font-bold text-gray-800">{(shippingFee || 0) === 0 ? "Chưa tính" : `${(shippingFee || 0).toLocaleString()}đ`}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span className="tracking-tight">Giảm giá voucher</span>
                    <span>-{(discountAmount || 0).toLocaleString()}đ</span>
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="border-t-2 border-dashed border-gray-100 pt-8 mb-10 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-black text-xl">Thanh toán</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-pink-500 block leading-none tracking-tighter">
                      {Math.max(0, finalTotal).toLocaleString()}đ
                    </span>
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1 block">Đã bao gồm thuế</span>
                  </div>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full relative group relative z-10"
              >
                <div className="absolute inset-0 bg-pink-600 rounded-2xl translate-y-2 group-hover:translate-y-1 transition-transform"></div>
                <div className="relative w-full bg-pink-500 hover:bg-pink-400 text-white py-5 rounded-2xl font-black text-lg transition-all transform group-hover:-translate-y-1 group-active:translate-y-1 group-active:shadow-none flex justify-center items-center gap-2 shadow-lg shadow-pink-200">
                  {submitting && <Loader2 size={24} className="animate-spin" />}
                  {submitting ? "Đang xử lý..." : `XÁC NHẬN ĐẶT HÀNG`}
                </div>
              </button>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default Checkout;
