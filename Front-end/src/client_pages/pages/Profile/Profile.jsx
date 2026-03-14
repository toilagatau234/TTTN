import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Flower, Heart, Gift, Star, Loader2, LogOut } from "lucide-react";
import { Calendar, Package, Hash } from "lucide-react";
import { message, Modal, Steps } from "antd";

import userService from "../../../services/userService";
import orderService from "../../../services/orderService";
import authService from "../../../services/authService";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // For Order Tracking Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStepCurrent = (status) => {
    if (status === 'Cancelled') return -1;
    switch (status) {
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  useEffect(() => {
    // Check nếu chưa login thì đá về /login
    if (!authService.isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để xem trang cá nhân");
      navigate("/login");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Profile + Orders song song
      const [profileRes, ordersRes] = await Promise.all([
        userService.getProfile(),
        orderService.getMyOrders()
      ]);

      if (profileRes.success) {
        setUser({
          name: profileRes.data.name || "",
          email: profileRes.data.email || "",
          phone: profileRes.data.phone || "",
          address: profileRes.data.address || "",
          avatar: profileRes.data.avatar || "https://placehold.co/150",
        });

        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...profileRes.data, token: currentUser?.token };
        authService.saveUser(updatedUser);
      }

      if (ordersRes.success) {
        setOrders(ordersRes.data || []);
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin:", error);
      message.error("Lỗi khi tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!user.name || !user.email) {
      message.warning("Tên và Email không được để trống");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      };

      // Xử lý đổi password nếu có nhập
      if (showPasswordChange) {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
          message.warning("Vui lòng nhập đủ mật khẩu cũ và mới");
          setSaving(false);
          return;
        }
        if (passwordData.newPassword.length < 6) {
          message.warning("Mật khẩu mới phải từ 6 ký tự");
          setSaving(false);
          return;
        }
        payload.currentPassword = passwordData.currentPassword;
        payload.newPassword = passwordData.newPassword;
      }

      const res = await userService.updateProfile(payload);
      if (res.success) {
        message.success("Cập nhật thông tin thành công!");
        setIsEditing(false);
        setShowPasswordChange(false);
        setPasswordData({ currentPassword: "", newPassword: "" });

        // Giữ lại token cũ khi update profile
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...res.data, token: currentUser?.token };
        authService.saveUser(updatedUser); // Update local storage
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("cartUpdated")); // Reset cart badge
    message.success("Đã đăng xuất");
    navigate("/login");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full text-xs font-semibold">Chờ xác nhận</span>;
      case 'Processing': return <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded-full text-xs font-semibold">Đang chuẩn bị</span>;
      case 'Shipped': return <span className="text-purple-500 bg-purple-50 px-2 py-1 rounded-full text-xs font-semibold">Đang giao</span>;
      case 'Delivered': return <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-xs font-semibold">Đã giao</span>;
      case 'Cancelled': return <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold">Đã hủy</span>;
      default: return <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 text-pink-400">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p>Đang tải thông tin cá nhân...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fffafc] min-h-screen py-14 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

        {/* SIDEBAR */}
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center h-fit sticky top-24">
          <img
            src={user.avatar || "https://placehold.co/150"}
            alt="avatar"
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-200"
          />
          <h2 className="text-2xl font-bold mt-5 text-pink-600">
            {user.name}
          </h2>
          <p className="text-gray-500 mt-2">{user.email}</p>

          <button
            onClick={handleLogout}
            className="mt-6 px-6 py-2 border-2 border-pink-100 text-pink-500 rounded-full hover:bg-pink-50 transition flex items-center justify-center gap-2 w-full"
          >
            <LogOut size={18} /> Đăng xuất
          </button>

          <div className="mt-8 bg-pink-50/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-pink-100 text-pink-500">
                <Flower size={16} />
              </div>
              <p className="text-sm text-pink-500 font-medium">
                Đơn hàng: <span className="font-semibold">{orders.length}</span>
              </p>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="md:col-span-2 space-y-10">

          {/* PERSONAL INFO SECTION */}
          <div className="bg-white rounded-3xl shadow-lg p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-emerald-500">
                Thông tin cá nhân
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-pink-50 text-pink-500 rounded-full hover:bg-pink-100 transition font-medium text-sm"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setIsEditing(false); setShowPasswordChange(false); }}
                    className="px-6 py-2 border border-gray-200 text-gray-500 rounded-full hover:bg-gray-50 transition font-medium text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition font-medium text-sm disabled:opacity-70"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Lưu
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-500 font-medium mb-2 text-sm">Họ và tên</label>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-2 text-sm">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-2 text-sm">Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={user.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-2 text-sm">Địa chỉ (Mặc định)</label>
                  <input
                    type="text"
                    name="address"
                    value={user.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  />
                </div>
              </div>

              {/* Password Change Option */}
              {isEditing && (
                <div className="pt-6 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={showPasswordChange}
                      onChange={(e) => setShowPasswordChange(e.target.checked)}
                      className="w-4 h-4 text-pink-500 rounded focus:ring-pink-400"
                    />
                    <span className="text-gray-700 font-medium text-sm">Đổi mật khẩu</span>
                  </label>

                  {showPasswordChange && (
                    <div className="grid md:grid-cols-2 gap-6 bg-pink-50/50 p-5 rounded-2xl border border-pink-100">
                      <div>
                        <label className="block text-gray-500 font-medium mb-2 text-sm">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Nhập mật khẩu cũ"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-2 text-sm">Mật khẩu mới</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Mật khẩu mới (từ 6 ký tự)"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ORDER HISTORY */}
          <div className="bg-white rounded-3xl shadow-lg p-10">
            <h3 className="text-2xl font-bold mb-6 text-emerald-500 flex justify-between items-center">
              Lịch sử đơn hàng
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-10">
                <Package size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500">Bạn chưa có đơn hàng nào cả.</p>
                <Link to="/shop" className="text-pink-500 hover:text-pink-600 font-medium mt-2 inline-block">Bắt đầu mua sắm ngay</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-100 hover:border-emerald-200 bg-white p-5 rounded-2xl transition shadow-sm group">
                    <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Mã ĐH: <span className="font-mono text-gray-800 font-medium">{order.orderCode}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">{getStatusBadge(order.status)}</div>
                        <p className="text-pink-500 font-bold">{order.totalPrice.toLocaleString()} đ</p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      {order.orderItems?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center">
                          <img
                            src={item.product?.images?.[0]?.url || "https://placehold.co/40"}
                            alt={item.product?.name || "Sản phẩm"}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 line-clamp-1">{item.product?.name || "Hoa Thiết Kế"}</p>
                            <p className="text-xs font-medium text-gray-500 bg-gray-100 w-fit px-2 py-0.5 rounded-md mt-1">x{item.quantity}</p>
                          </div>
                          <p className="font-bold text-gray-700">{(item.price * item.quantity).toLocaleString()} đ</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-between items-center border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        Thanh toán: <span className="font-semibold text-gray-800">{order.paymentMethod}</span>
                      </p>
                      <button
                        onClick={() => handleOpenOrderDetail(order)}
                        className="text-emerald-500 hover:text-white hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-500 transition-all duration-300 shadow-sm hover:shadow"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <Modal
        title={<span className="text-emerald-600 font-bold text-lg">Chi tiết đơn hàng {selectedOrder?.orderCode}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div className="space-y-6 mt-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="font-semibold text-gray-800 mb-2 border-b pb-2">Thông tin nhận hàng</h4>
              <p className="text-sm text-gray-600"><span className="font-medium">Người nhận:</span> {selectedOrder.shippingInfo?.fullName} - {selectedOrder.shippingInfo?.phone}</p>
              <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Địa chỉ:</span> {selectedOrder.shippingInfo?.address}</p>
              {selectedOrder.shippingInfo?.note && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Ghi chú:</span> {selectedOrder.shippingInfo?.note}</p>}
            </div>

            <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
              <h4 className="font-semibold text-emerald-600 mb-6">Trạng thái vận chuyển</h4>
              {selectedOrder.status === 'Cancelled' ? (
                <div className="text-center text-red-500 font-bold py-4 bg-red-50 rounded-lg">Đơn hàng đã bị hủy</div>
              ) : (
                <Steps
                  current={getStepCurrent(selectedOrder.status)}
                  items={[
                    { title: 'Ch chờ xác nhận', description: 'Đơn hàng mới' },
                    { title: 'Đang chuẩn bị', description: 'Gói hoa' },
                    { title: 'Đang giao', description: 'Shipper đang đi' },
                    { title: 'Đã giao', description: 'Thành công' },
                  ]}
                />
              )}
            </div>

            {selectedOrder.voucher && (
              <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg flex justify-between">
                <span>Voucher áp dụng: <b>{selectedOrder.voucher}</b></span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Profile;