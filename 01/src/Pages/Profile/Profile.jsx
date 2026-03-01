import { useState } from "react";
import { Flower, Heart, Gift, Star, Truck } from "lucide-react";
import { Calendar, Package, Hash } from "lucide-react";
const Profile = () => {
  const [user, setUser] = useState({
    name: "Trần Thuật",
    email: "antinh@gmail.com",
    phone: "0987 654 321",
    address: "123 Nguyễn Trãi, TP.HCM",
    avatar: null,
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-[#fffafc] min-h-screen py-14 px-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

        {/* SIDEBAR */}
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <img
            src={user.avatar}
            alt="avatar"
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-200"
          />
          <h2 className="text-2xl font-bold mt-5 text-pink-600">
            {user.name}
          </h2>
          <p className="text-gray-500 mt-2">{user.email}</p>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-6 px-6 py-2 bg-pink-400 text-white rounded-full hover:bg-pink-600 transition"
          >
            {isEditing ? "Lưu thông tin" : "Chỉnh sửa"}
          </button>

          <div className="mt-8 bg-pink-50/60 rounded-2xl p-5 space-y-4">

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-pink-100 text-pink-500">
                <Flower size={16} />
              </div>
              <p className="text-sm text-pink-500 font-medium">
                Đơn đã mua: <span className="font-semibold">12</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-100 text-rose-500">
                <Heart size={16} />
              </div>
              <p className="text-sm text-rose-500 font-medium">
                Sản phẩm yêu thích: <span className="font-semibold">5</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                <Gift size={16} />
              </div>
              <p className="text-sm text-emerald-500 font-medium">
                Voucher khả dụng: <span className="font-semibold">2</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
                <Star size={16} />
              </div>
              <p className="text-sm text-yellow-500 font-medium">
                Điểm tích lũy: <span className="font-semibold">350 điểm</span>
              </p>
            </div>

          </div>

        </div>

        {/* INFO */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-lg p-10">

          <h3 className="text-2xl font-bold mb-8 text-[#88a82a]">            
            Thông tin cá nhân
          </h3>

          <div className="space-y-6">

            <div>
              <label className="block text-pink-300 font-medium mb-2">Họ và tên</label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full border border-pink-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-pink-600 bg-pink-10"
              />
            </div>

            <div>
              <label className="block text-pink-300 font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full border border-pink-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-pink-600 bg-pink-10"
              />
            </div>

            <div>
              <label className="block text-pink-300 font-medium mb-2">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={user.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full border border-pink-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-pink-600 bg-pink-10"
              />
            </div>

            <div>
              <label className="block text-pink-300 font-medium mb-2">Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={user.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full border border-pink-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-pink-600 bg-pink-10"
              />
            </div>

          </div>
        </div>

      </div>

      {/* ORDER HISTORY */}
      <div className="max-w-6xl mx-auto mt-16 bg-white rounded-3xl shadow-lg p-10">
        <h3 className="text-2xl font-bold mb-6 text-[#88a82a]">
          Lịch sử đơn hàng
        </h3>

        <div className="space-y-4">

          <div className="flex justify-between items-center border border-emerald-200 bg-emerald-30 p-4 rounded-2xl">
            <div>
              <p className="block text-pink-400 font-medium mb-2">Cẩm Tú Cầu Mộng Mơ</p>
              <p className="block text-pink-300 font-medium mb-2">Ngày: 20/02/2026</p>
            </div>
            <p className="text-pink-400 font-bold">750.000 đ</p>
          </div>

          <div className="flex justify-between items-center border border-emerald-200 bg-emerald-30 p-4 rounded-2xl">
            <div>
              <p className="block text-pink-400 font-medium mb-2">Hoa Cưới Luxury</p>
              <p className="block text-pink-300 font-medium mb-2">Ngày: 15/02/2026</p>
            </div>
            <p className="text-pink-400 font-bold">1.200.000 đ</p>
          </div>

        </div>
      </div>
      {/* VOUCHER */}
<div className="max-w-6xl mx-auto mt-16 bg-white rounded-3xl shadow-lg p-10">
  <h3 className="text-2xl font-bold mb-8 text-[#88a82a]">
    Voucher khuyến mãi 
  </h3>

  <div className="grid md:grid-cols-2 gap-8">

    {/* Voucher 1 */}
    <div className="relative bg-pink-50 border border-pink-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-lg font-bold text-pink-500">GIẢM 20%</p>
            <p className="text-sm text-gray-500 mt-1">
              Cho đơn từ 500.000đ
            </p>
          </div>

          <span className="text-xs bg-pink-100 text-pink-500 px-3 py-1 rounded-full">
            Còn hiệu lực
          </span>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-dashed border-pink-200"></div>

        {/* Info */}
        <div className="space-y-3 mt-4">

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-400 flex items-center justify-center">
              <Calendar size={14} />
            </div>
            <span>HSD: 30/03/2026</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-400 flex items-center justify-center">
              <Package size={14} />
            </div>
            <span>Áp dụng: Cẩm Tú Cầu Mộng Mơ</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-400 flex items-center justify-center">
              <Hash size={14} />
            </div>
            <span>Còn lại: 25 voucher</span>
          </div>

</div>

        {/* Code + Button */}
        <div className="flex justify-between items-center mt-5">
          <p className="font-mono text-pink-500 font-semibold tracking-wider">
            FLOWER20
          </p>

          <button
            onClick={() => navigator.clipboard.writeText("FLOWER20")}
            className="bg-pink-100 text-pink-500 px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-200 transition"
          >
            Sao chép
          </button>
        </div>

  </div>

    {/* Voucher 2 */}
       <div className="relative bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">

            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-emerald-400">GIẢM 100K</p>
                <p className="text-sm text-gray-500 mt-1">
                  Cho đơn từ 800.000đ
                </p>
              </div>

              <span className="text-xs bg-emerald-100 text-emerald-500 px-3 py-1 rounded-full">
                Còn hiệu lực
              </span>
            </div>

            <div className="my-4 border-t border-dashed border-emerald-200"></div>

            <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-400 flex items-center justify-center">
                <Calendar size={14} />
              </div>
              <span>HSD: 30/03/2026</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-400 flex items-center justify-center">
                <Package size={14} />
              </div>
              <span>Áp dụng: Hoa Cưới</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-400 flex items-center justify-center">
                <Hash size={14} />
              </div>
              <span>Còn lại: 25 voucher</span>
            </div>

</div>
            <div className="flex justify-between items-center mt-5">
              <p className="font-mono text-emerald-500 font-semibold tracking-wider">
                SAVE100
              </p>

              <button
                onClick={() => navigator.clipboard.writeText("SAVE100")}
                className="bg-emerald-100 text-emerald-500 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-200 transition"
              >
                Sao chép
              </button>
            </div>

          </div>

      </div>
    </div>

    </div>
  );
};

export default Profile;