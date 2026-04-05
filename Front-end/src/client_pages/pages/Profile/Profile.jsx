import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, Skeleton } from "antd";

import ProfileSidebar from "./ProfileSidebar";
import ProfileInfo from "./ProfileInfo";
import OrderHistory from "./OrderHistory";

import userService from "../../../services/userService";
import orderService from "../../../services/orderService";
import authService from "../../../services/authService";
import cartService from "../../../services/cartService";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "Khác",
    dateOfBirth: "",
    avatar: "",
  });

  const [addressParts, setAddressParts] = useState({
    city: "",
    district: "",
    ward: "",
    street: ""
  });

  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);



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
          gender: profileRes.data.gender || "Khác",
          dateOfBirth: profileRes.data.dateOfBirth ? profileRes.data.dateOfBirth.substring(0, 10) : "",
          avatar: profileRes.data.avatar || "https://placehold.co/150",
        });

        // Split existing address if possible
        if (profileRes.data.address) {
          const parts = profileRes.data.address.split(" - ");
          if (parts.length === 4) {
             setAddressParts({
               street: parts[0] || "",
               ward: parts[1] || "",
               district: parts[2] || "",
               city: parts[3] || ""
             });
          } else {
             setAddressParts(prev => ({ ...prev, street: profileRes.data.address }));
          }
        }

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

  const handleAddressChange = (e) => {
    setAddressParts({ ...addressParts, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn file hình ảnh');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await userService.uploadImage(formData);
      if (res.success) {
        // Chỉ cập nhật hiển thị cục bộ, chưa lưu vào back-end đến khi user nhấn "Lưu"
        // Hoặc có thể gọi API update profile ngay lập tức. Ta gọi ngay lập tức cho tiện dụng.
        const updateRes = await userService.updateProfile({
           name: user.name,
           email: user.email,
           phone: user.phone,
           address: user.address,
           avatar: res.imageUrl
        });
        
        if (updateRes.success) {
          setUser({ ...user, avatar: res.imageUrl });
          // Cập nhật local storage luôn để thay đổi hiện ra trên Header
          const currentUser = authService.getCurrentUser();
          const updatedUser = { ...updateRes.data, token: currentUser?.token };
          authService.saveUser(updatedUser);
          window.dispatchEvent(new Event("cartUpdated")); // Dùng đại event này hoặc tự dispatch profileUpdated
          message.success('Cập nhật ảnh đại diện thành công');
        }
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user.name || !user.email) {
      message.warning("Tên và Email không được để trống");
      return;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      message.warning("Email không đúng định dạng");
      return;
    }

    // Validate Phone
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (user.phone && !phoneRegex.test(user.phone)) {
      message.warning("Số điện thoại không hợp lệ (phải gồm 10 số hợp lệ tại VN)");
      return;
    }

    setSaving(true);
    try {
      // Assemble the full address
      let fullAddress = user.address;
      if (addressParts.city || addressParts.district || addressParts.ward || addressParts.street) {
        fullAddress = [addressParts.street, addressParts.ward, addressParts.district, addressParts.city]
          .filter(Boolean)
          .join(" - ");
      }

      const payload = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: fullAddress,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth
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
    authService.logout();
    window.dispatchEvent(new Event("cartUpdated")); // Reset cart badge
    message.success("Đã đăng xuất");
    navigate("/login");
  };

  const handleReorder = async (order) => {
    try {
      let successCount = 0;
      for (const item of order.orderItems) {
        if (item.product?._id) {
          const res = await cartService.addToCart(item.product._id, item.quantity);
          if (res.success) successCount++;
        }
      }
      if (successCount > 0) {
        window.dispatchEvent(new Event("cartUpdated"));
        message.success(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`);
        navigate('/cart');
      } else {
        message.warning("Không thể thêm sản phẩm nào vào giỏ");
      }
    } catch (error) {
      message.error("Có lỗi khi thêm vào giỏ hàng");
    }
  };

  return (
    <div className="bg-[#fffafc] min-h-screen py-14 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
        
        {loading ? (
          <>
            {/* Sidebar Skeleton */}
            <div className="bg-white rounded-3xl shadow-lg p-8 h-fit">
              <Skeleton.Avatar active size={130} shape="circle" className="mx-auto block mb-6" />
              <Skeleton active paragraph={{ rows: 2, width: ['100%', '80%'] }} title={{ width: '60%' }} className="text-center flex flex-col items-center" />
              <Skeleton.Button active block shape="round" className="mt-8 h-10" />
            </div>
            
            {/* Content Skeleton */}
            <div className="md:col-span-2 space-y-10">
              <div className="bg-white rounded-3xl shadow-lg p-10">
                <Skeleton active title={{ width: 200 }} paragraph={{ rows: 6 }} />
              </div>
              <div className="bg-white rounded-3xl shadow-lg p-10">
                <Skeleton active title={{ width: 250 }} paragraph={{ rows: 8 }} />
              </div>
            </div>
          </>
        ) : (
          <>
            <ProfileSidebar 
              user={user} 
              uploadingAvatar={uploadingAvatar} 
              handleAvatarChange={handleAvatarChange} 
              handleLogout={handleLogout} 
              orderCount={orders.length}
            />

            <div className="md:col-span-2 space-y-10">
              <ProfileInfo 
                user={user}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                handleChange={handleChange}
                addressParts={addressParts}
                handleAddressChange={handleAddressChange}
                showPasswordChange={showPasswordChange}
                setShowPasswordChange={setShowPasswordChange}
                passwordData={passwordData}
                handlePasswordChange={handlePasswordChange}
                handleSaveProfile={handleSaveProfile}
                saving={saving}
              />
              
              <OrderHistory 
                orders={orders} 
                handleReorder={handleReorder}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;