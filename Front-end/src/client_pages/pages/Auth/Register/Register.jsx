import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { message } from "antd"
import authService from "../../../../services/authService"

const Register = () => {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    // Validate
    if (!name || !email || !password || !confirmPassword) {
      message.warning("Vui lòng nhập đầy đủ thông tin")
      return
    }

    if (password.length < 6) {
      message.warning("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    if (password !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp")
      return
    }

    setLoading(true)
    try {
      const res = await authService.register(name, email, password)

      if (res.success) {
        // Tự động đăng nhập sau khi đăng ký
        authService.saveUser(res.data)
        message.success("Đăng ký thành công! 🎉")
        navigate("/")
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Đăng ký thất bại"
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-pink-50 via-white to-emerald-50 px-4">

      <div className="bg-white w-full max-w-md p-10 rounded-3xl 
      shadow-xl border border-emerald-100">

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-emerald-400">
            Đăng ký tài khoản
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Tạo tài khoản để mua hoa dễ dàng hơn
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">

          {/* Họ tên */}
          <div>
            <label className="text-gray-500 text-sm">Họ và tên</label>
            <div className="relative mt-2">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Nhập họ tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-emerald-100 pl-12 pr-4 py-3 
                rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-500 text-sm">Email</label>
            <div className="relative mt-2">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" />
              <input
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-emerald-100 pl-12 pr-4 py-3 
                rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-500 text-sm">Mật khẩu</label>
            <div className="relative mt-2">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-emerald-100 pl-12 pr-12 py-3 
                rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-gray-500 text-sm">Xác nhận mật khẩu</label>
            <div className="relative mt-2">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" />
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-emerald-100 pl-12 pr-4 py-3 
                rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-300 hover:bg-emerald-400 disabled:opacity-60
            text-white py-3 rounded-2xl transition shadow-md hover:shadow-lg
            flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>

          {/* Link */}
          <div className="text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-pink-400 hover:underline">
              Đăng nhập
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}

export default Register