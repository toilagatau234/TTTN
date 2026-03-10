import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Heart, ShoppingCart, User, Search } from "lucide-react"
import { MessageCircle } from "lucide-react"
import { Bell, Gift, Tag, Sparkles, X } from "lucide-react"
import { Home, Flower, LayoutGrid, Shapes } from "lucide-react"
import cartService from "../../../../../services/cartService"

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const fetchCartCount = async () => {
    try {
      const res = await cartService.getCart()
      if (res.success && res.data) {
        // Tổng số loại sản phẩm trong giỏ (hoặc tổng số lượng tuỳ UX)
        const regularCount = res.data.items?.length || 0;
        const customCount = res.data.customBouquets?.length || 0;
        setCartCount(regularCount + customCount);
      }
    } catch (error) {
      setCartCount(0);
    }
  }

  useEffect(() => {
    fetchCartCount();

    // Lắng nghe event từ ProductDetail (khi thêm vào giỏ) và Cart/Checkout
    window.addEventListener("cartUpdated", fetchCartCount);
    return () => window.removeEventListener("cartUpdated", fetchCartCount);
  }, [])

  return (
    <header className="shadow-sm sticky top-0 z-50 bg-white">

      {/* ================= TOP NAV ================= */}
      <div className="border-b">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="text-2xl font-bold text-[#f472b6]">
            🌸 FlowerShop
          </Link>

          {/* SEARCH */}
          <div className="hidden md:flex items-center bg-pink-50 border border-pink-200 px-4 py-2 rounded-full w-[400px] shadow-sm">
            <Search size={18} className="text-pink-400 hover:text-pink-500 transition duration-300" />
            <input
              type="text"
              placeholder="Tìm kiếm hoa..."
              className="bg-transparent outline-none ml-3 w-full text-sm"
            />
          </div>

          {/* ICONS */}
          <div className="flex items-center space-x-6">

            <div className="flex items-center gap-6 text-pink-400">
              <div className="relative flex items-center">
                <button
                  onClick={() => setOpenMenu(openMenu === "notify" ? null : "notify")}
                  className="hover:text-pink-500 transition"
                >
                  <Bell size={22} />
                </button>

                {openMenu === "notify" && (
                  <div className="absolute right-0 top-full mt-3 w-80 bg-white shadow-2xl rounded-3xl p-6 border border-pink-100 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-pink-400 font-semibold text-sm">
                        Thông báo
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenu(null)
                          setShowAll(false)
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-pink-50 transition">
                        <X size={18} strokeWidth={1.5} className="text-pink-300" />
                      </button>
                    </div>
                    <div className="space-y-4 text-sm text-gray-600">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 bg-pink-50 rounded-ful flex items-center justify-center">
                          <Gift size={16} className="text-pink-400" />
                        </div>
                        <div>
                          <p className="font-medium">Ưu đãi hôm nay</p>
                          <p className="text-gray-400 text-xs">
                            Giảm 20% hoa sinh nhật
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-9 h-9 bg-pink-50 rounded-full flex items-center justify-center">
                          <Tag size={16} className="text-pink-400" />
                        </div>
                        <div>
                          <p className="font-medium">Wishlist giảm giá</p>
                          <p className="text-gray-400 text-xs">
                            Sản phẩm bạn yêu thích đang giảm
                          </p>
                        </div>
                      </div>
                      {showAll && (
                        <div className="pt-4 border-t border-pink-100 space-y-4">
                          <div className="flex gap-3">
                            <div className="w-9 h-9 bg-pink-50 rounded-full flex items-center justify-center">
                              <Sparkles size={16} className="text-pink-400" />
                            </div>
                            <div>
                              <p className="font-medium">Miễn phí giao hàng</p>
                              <p className="text-gray-400 text-xs">
                                Cho đơn từ 500.000đ
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="mt-6 w-full text-center text-sm text-pink-400 hover:text-pink-500 transition">
                      {showAll ? "Ẩn bớt" : "Xem tất cả"}
                    </button>

                  </div>
                )}
              </div>
            </div>
            <Link to="/wishlist" className="text-pink-400 hover:text-pink-500 transition duration-300">
              <Heart size={22} />
            </Link>

            <Link
              to="/mess"
              className="text-pink-400 hover:text-pink-500 transition">
              <MessageCircle size={21} />
            </Link>

            <Link to="/cart" className="relative text-pink-400 hover:text-pink-500 transition duration-300">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#86efac] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex justify-center items-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* ACCOUNT DROPDOWN */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu("account")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link to="/profile">
                <User
                  size={22}
                  className="relative text-pink-400 hover:text-pink-500 transition duration-300"
                />
              </Link>
              {openMenu === "account" && (
                <div className="absolute right-0 mt-3 w-40 bg-white shadow-lg rounded-xl p-3 text-fuchsia-400">
                  <Link
                    to="/profile"
                    className="block py-2 text-sm hover:text-[#f472b6]"
                  >
                    Tài khoản
                  </Link>
                  <button className="block w-full text-left py-2 text-sm hover:text-red-500">
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ================= BOTTOM NAV ================= */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-t border-pink-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className="px-5 py-2 rounded-full text-pink-500 hover:bg-pink-400 hover:text-white transition duration-200" >
            Trang chủ
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("hoatuoi")}
            onMouseLeave={() => setOpenMenu(null)}>
            <span className="px-5 py-2 rounded-full text-pink-500 hover:bg-pink-400 hover:text-white transition duration-200" >
              Hoa tươi
            </span>
            {openMenu === "hoatuoi" && (
              <div className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-2xl p-4 w-48 border border-pink-100 text-pink-500">
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa hồng</Link>
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa tulip</Link>
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa hướng dương</Link>
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa lan</Link>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("chude")}
            onMouseLeave={() => setOpenMenu(null)} >
            <span className="px-5 py-2 rounded-full text-pink-500 hover:bg-pink-400 hover:text-white transition duration-200" >
              Chủ đề
            </span>
            {openMenu === "chude" && (
              <div className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-2xl p-4 w-48 border border-pink-100 text-pink-500">
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa cưới</Link>
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa sinh nhật</Link>
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa tốt nghiệp</Link>
                <Link to="/" className="block py-2 hover:text-pink-400">Hoa khai trương</Link>
              </div>
            )}
          </div>
          <Link
            to="/customDesign"
            className="px-5 py-2 rounded-full text-pink-500 hover:bg-pink-400 hover:text-white transition duration-200" >
            Thiết kế hoa
          </Link>
          <Link
            to="/miniGame"
            className="px-5 py-2 rounded-full text-pink-500 hover:bg-pink-400 hover:text-white transition duration-200" >
            MiniGame
          </Link>
          <Link
            to="/mess"
            className="px-5 py-2 rounded-full text-pink-500 hover:bg-pink-400 hover:text-white transition duration-200" >
            Nhắn tin
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
