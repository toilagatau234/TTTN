import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { message } from "antd"
import authService from "../../../../services/authService"

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      message.warning("Vui lòng nhập email và mật khẩu")
      return
    }

    setLoading(true)
    try {
      const res = await authService.login(email, password)

      if (res.success) {
        // Lưu user + token vào localStorage
        authService.saveUser(res.data)
        message.success("Đăng nhập thành công!")

        // Redirect dựa trên role
        if (["Admin", "Manager", "Staff"].includes(res.data.role)) {
          navigate("/admin")
        } else {
          navigate("/")
        }
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Đăng nhập thất bại"
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-pink-50 via-white to-emerald-50 px-4">

      <div className="bg-white w-full max-w-md p-10 rounded-3xl 
      shadow-xl border border-pink-100">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-pink-400">
            Đăng nhập
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Chào mừng bạn quay trở lại
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          {/* Email */}
          <div>
            <label className="text-gray-500 text-sm">Email</label>
            <div className="relative mt-2">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
              <input
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-pink-100 pl-12 pr-4 py-3 
                rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-500 text-sm">Mật khẩu</label>
            <div className="relative mt-2">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-pink-100 pl-12 pr-12 py-3 
                rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-400 hover:bg-pink-500 disabled:opacity-60
            text-white py-3 rounded-2xl transition shadow-md hover:shadow-lg
            flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-pink-400 hover:underline">
              Đăng ký ngay
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}

export default Login