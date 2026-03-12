import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, User, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Send } from "lucide-react"
import { message } from "antd"
import authService from "../../../../services/authService"

const RESEND_COOLDOWN = 60 // giây

const Register = () => {
  const navigate = useNavigate()

  // Step: 1 = form info, 2 = nhập OTP
  const [step, setStep] = useState(1)

  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // OTP fields
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""])
  const otpRefs = useRef([])

  // Loading & cooldown
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Countdown đếm ngược gửi lại
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // ── Bước 1: Validate form & gửi OTP ──
  const handleSendOtp = async (e) => {
    e.preventDefault()

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
      await authService.sendOtp(email)
      message.success(`Mã OTP đã gửi đến ${email}`)
      setStep(2)
      setCountdown(RESEND_COOLDOWN)
      setOtpDigits(["", "", "", "", "", ""])
      // Focus ô đầu tiên
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (error) {
      const msg = error?.response?.data?.message || "Không thể gửi OTP, thử lại"
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Xử lý nhập từng ô OTP ──
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value
    setOtpDigits(newDigits)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newDigits = [...otpDigits]
    pasted.split("").forEach((ch, i) => { newDigits[i] = ch })
    setOtpDigits(newDigits)
    const focusIdx = Math.min(pasted.length, 5)
    otpRefs.current[focusIdx]?.focus()
  }

  // ── Gửi lại OTP ──
  const handleResendOtp = async () => {
    if (countdown > 0) return
    setLoading(true)
    try {
      await authService.sendOtp(email)
      message.success("Đã gửi lại mã OTP!")
      setCountdown(RESEND_COOLDOWN)
      setOtpDigits(["", "", "", "", "", ""])
      otpRefs.current[0]?.focus()
    } catch (error) {
      const msg = error?.response?.data?.message || "Không thể gửi lại OTP"
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Bước 2: Xác nhận OTP & Đăng ký ──
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    const code = otpDigits.join("")
    if (code.length < 6) {
      message.warning("Vui lòng nhập đủ 6 số OTP")
      return
    }

    setLoading(true)
    try {
      // Xác nhận OTP
      await authService.verifyOtp(email, code)

      // Đăng ký tài khoản
      const res = await authService.register(name, email, password)
      if (res.success) {
        authService.saveUser(res.data)
        message.success("Đăng ký thành công! 🎉")
        navigate("/")
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Xác nhận thất bại. Vui lòng thử lại."
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

        {/* ══════════ STEP 1: Form thông tin ══════════ */}
        {step === 1 && (
          <>
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-emerald-400">
                Đăng ký tài khoản
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Tạo tài khoản để mua hoa dễ dàng hơn
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-6">

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

              {/* Button gửi OTP */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:opacity-60
                text-white py-3 rounded-2xl transition shadow-md hover:shadow-lg
                flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Đang gửi mã...</>
                  : <><Send size={18} /> Gửi mã xác nhận</>
                }
              </button>

              {/* Link đăng nhập */}
              <div className="text-center text-sm text-gray-500">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-pink-400 hover:underline">
                  Đăng nhập
                </Link>
              </div>
            </form>
          </>
        )}

        {/* ══════════ STEP 2: Nhập OTP ══════════ */}
        {step === 2 && (
          <>
            {/* Title */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center
                border-2 border-emerald-200">
                  <ShieldCheck size={28} className="text-emerald-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-emerald-400">Xác nhận email</h2>
              <p className="text-sm text-gray-400 mt-2">
                Nhập mã 6 số đã gửi đến
              </p>
              <p className="text-sm font-semibold text-emerald-500 mt-1">{email}</p>
            </div>

            <form onSubmit={handleVerifyAndRegister} className="space-y-6">

              {/* OTP Boxes */}
              <div>
                <label className="text-gray-500 text-sm block mb-3 text-center">
                  Mã xác nhận OTP
                </label>
                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-12 h-14 text-center text-xl font-bold border-2
                      border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-400
                      focus:ring-2 focus:ring-emerald-100 transition bg-emerald-50
                      text-emerald-700 caret-emerald-400"
                    />
                  ))}
                </div>
              </div>

              {/* Gửi lại OTP */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Gửi lại mã sau{" "}
                    <span className="font-semibold text-emerald-500">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-sm text-emerald-500 hover:text-emerald-600 hover:underline
                    disabled:opacity-50 transition"
                  >
                    Gửi lại mã xác nhận
                  </button>
                )}
              </div>

              {/* Nút xác nhận & đăng ký */}
              <button
                type="submit"
                disabled={loading || otpDigits.join("").length < 6}
                className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:opacity-60
                text-white py-3 rounded-2xl transition shadow-md hover:shadow-lg
                flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Đang xác nhận...</>
                  : <><ShieldCheck size={18} /> Xác nhận &amp; Đăng ký</>
                }
              </button>

              {/* Quay lại bước 1 */}
              <button
                type="button"
                onClick={() => { setStep(1); setOtpDigits(["", "", "", "", "", ""]) }}
                className="w-full flex items-center justify-center gap-2
                text-sm text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft size={16} /> Quay lại chỉnh sửa thông tin
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}

export default Register