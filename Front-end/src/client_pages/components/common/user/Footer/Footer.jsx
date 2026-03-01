import { MapPin, Phone, Mail, Facebook, Instagram, Flower2, Clock, Truck } from "lucide-react"

const Footer = () => {
  return (
    <footer className="border-t py-6 bg-[#fffafc] from-pink-100 via-rose-100 to-purple-100 animate-gradient relative overflow-hidden">

      {/* Hoa rơi */}
      `  <div className="absolute inset-0 pointer-events-none overflow-hidden">

          <img
            src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271341/flowers_uccuf7.png"
            className="flower flower1"
            alt=""
          />

          <img
            src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271341/flowers_uccuf7.png"
            className="flower flower2"
            alt=""
          />

          <img
            src="https://res.cloudinary.com/drwles2k0/image/upload/v1772274516/flower_1_lka9bg.png"
            className="flower flower3"
            alt=""
          />

          <img
            src="https://res.cloudinary.com/drwles2k0/image/upload/v1772274516/flower_1_lka9bg.png"
            className="flower flower4"
            alt=""
          />

          <img
            src="https://res.cloudinary.com/drwles2k0/image/upload/v1772271341/flowers_uccuf7.png"
            className="flower flower5"
            alt=""
          />

        </div>
      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-gray-600">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-100 
            flex items-center justify-center">
              <Flower2 size={20} className="text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-pink-400">
              FlowerShop
            </h3>
          </div>

          <p className="text-sm leading-relaxed">
            Chuyên hoa tươi cao cấp, thiết kế theo yêu cầu, 
            hoa sinh nhật, khai trương và sự kiện.
          </p>

          <div className="flex items-center gap-3 mt-4 text-sm">
            <Truck size={16} className="text-pink-300" />
            <span>Giao hoa nhanh trong 2 giờ nội thành</span>
          </div>
        </div>
        {/* Liên hệ */}
        <div>
          <h3 className="text-lg font-semibold mb-5 text-pink-400">
            Liên hệ
          </h3>
          <div className="space-y-4 text-sm">

            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-pink-300" />
              <span>Cần Thơ, Việt Nam</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-pink-300" />
              <span>0123 456 789</span>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-pink-300" />
              <span>flowershop@gmail.com</span>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={18} className="text-pink-300" />
              <span>8:00 - 21:00 mỗi ngày</span>
            </div>

          </div>
        </div>
        {/* Social */}
        <div>
          <h3 className="text-lg font-semibold mb-5 text-pink-400">
            Theo dõi chúng tôi
          </h3>

          <div className="flex gap-4">

            <div className="w-10 h-10 rounded-full bg-pink-100 
            flex items-center justify-center 
            hover:bg-pink-200 transition cursor-pointer">
              <Facebook size={18} className="text-pink-400" />
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-100 
            flex items-center justify-center 
            hover:bg-pink-200 transition cursor-pointer">
              <Instagram size={18} className="text-pink-400" />
            </div>

          </div>

          <p className="text-sm text-gray-400 mt-4">
            Theo dõi để nhận ưu đãi và mẫu hoa mới mỗi tuần 🌸
          </p>
          </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-pink-100 py-3 text-center text-sm text-gray-400">
        © 2026 FlowerShop. Thiết kế với 💗 dành cho những khoảnh khắc đặc biệt.
      </div>

    </footer>
  )
}

export default Footer