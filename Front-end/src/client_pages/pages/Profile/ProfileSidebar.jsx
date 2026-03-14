import { Flower, LogOut, Camera, Loader2 } from "lucide-react";

const ProfileSidebar = ({ user, uploadingAvatar, handleAvatarChange, handleLogout, orderCount }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 text-center h-fit sticky top-24">
      <div className="relative w-32 h-32 mx-auto mb-5 group">
        <img
          src={user.avatar || "https://placehold.co/150"}
          alt="avatar"
          className={`w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-200 transition-opacity ${uploadingAvatar ? 'opacity-50' : ''}`}
        />
        {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center">
               <Loader2 className="animate-spin text-pink-500 w-8 h-8"/>
            </div>
        )}
        <label className="absolute bottom-0 right-0 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-pink-600 transition shadow-lg opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
           <Camera size={18} />
           <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
        </label>
      </div>
      <h2 className="text-2xl font-bold text-pink-600">
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
            Đơn hàng: <span className="font-semibold">{orderCount}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
