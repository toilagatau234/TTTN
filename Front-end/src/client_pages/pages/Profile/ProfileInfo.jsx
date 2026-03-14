import { Loader2 } from "lucide-react";

const ProfileInfo = ({ 
  user, 
  isEditing, 
  setIsEditing, 
  handleChange, 
  addressParts, 
  handleAddressChange, 
  showPasswordChange, 
  setShowPasswordChange, 
  passwordData, 
  handlePasswordChange, 
  handleSaveProfile, 
  saving 
}) => {
  return (
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
            <label className="block text-gray-500 font-medium mb-2 text-sm">Giới tính</label>
            <select
              name="gender"
              value={user.gender}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-500 font-medium mb-2 text-sm">Ngày sinh</label>
            <input
              type="date"
              name="dateOfBirth"
              value={user.dateOfBirth}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
            />
          </div>
        </div>

        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <h4 className="text-gray-700 font-semibold mb-4">Địa chỉ nhận hàng</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-500 font-medium mb-2 text-xs">Tỉnh / Thành phố</label>
              <input
                type="text"
                name="city"
                value={addressParts.city}
                onChange={handleAddressChange}
                disabled={!isEditing}
                placeholder="VD: Hồ Chí Minh"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-300 outline-none text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-2 text-xs">Quận / Huyện</label>
              <input
                type="text"
                name="district"
                value={addressParts.district}
                onChange={handleAddressChange}
                disabled={!isEditing}
                placeholder="VD: Quận Bình Thạnh"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-300 outline-none text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-2 text-xs">Phường / Xã</label>
              <input
                type="text"
                name="ward"
                value={addressParts.ward}
                onChange={handleAddressChange}
                disabled={!isEditing}
                placeholder="VD: phường 24"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-300 outline-none text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-2 text-xs">Địa chỉ cụ thể</label>
              <input
                type="text"
                name="street"
                value={addressParts.street}
                onChange={handleAddressChange}
                disabled={!isEditing}
                placeholder="Số nhà, tên đường..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-300 outline-none text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 transition"
              />
            </div>
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
  );
};

export default ProfileInfo;
