import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { message } from 'antd';
import authService from '../../../../services/authService';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    
    // Step 1 states
    const [email, setEmail] = useState('');
    const [loadingEmail, setLoadingEmail] = useState(false);
    
    // Step 2 states
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingReset, setLoadingReset] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            message.warning("Vui lòng nhập email của bạn.");
            return;
        }

        setLoadingEmail(true);
        try {
            const res = await authService.forgotPassword(email);
            if (res.success) {
                message.success(res.message || "Mã xác nhận đã được gửi vào email!");
                setStep(2);
            }
        } catch (error) {
            const msg = error?.response?.data?.message || "Lỗi khi gửi email xác nhận.";
            message.error(msg);
        } finally {
            setLoadingEmail(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp.trim() || !newPassword || !confirmPassword) {
            message.warning("Vui lòng điền đầy đủ các thông tin.");
            return;
        }
        if (newPassword.length < 6) {
            message.warning("Mật khẩu mới phải dài ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            message.error("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoadingReset(true);
        try {
            const res = await authService.resetPassword(email, otp, newPassword);
            if (res.success) {
                message.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
                navigate("/login");
            }
        } catch (error) {
            const msg = error?.response?.data?.message || "Mã xác nhận sai hoặc đã hết hạn.";
            message.error(msg);
        } finally {
            setLoadingReset(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-emerald-50 px-4 py-12">
            <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-xl border border-pink-100 relative overflow-hidden">
                
                {/* Decorative bubbles */}
                <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-pink-100 rounded-full blur-xl opacity-60"></div>
                <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-yellow-50 rounded-full blur-xl opacity-60"></div>

                <div className="relative z-10 text-center mb-8">
                    <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-100">
                        <KeyRound className="text-pink-400 w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-pink-500 tracking-tight">
                        Quên Mật Khẩu
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 px-2">
                        {step === 1 ? "Nhập email của bạn để nhận mã khôi phục an toàn" : "Vui lòng kiểm tra hộp thư email và đặt mật khẩu mới"}
                    </p>
                </div>

                <div className="relative z-10">
                    {/* STEP 1: Enter Email */}
                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-6 animate-fade-in">
                            <div>
                                <label className="text-gray-600 font-medium text-sm ml-1 mb-1 block">Địa chỉ Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
                                    <input
                                        type="email"
                                        placeholder="Nhập email tài khoản"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-pink-100 bg-gray-50/50 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingEmail || !email}
                                className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:opacity-60 text-white py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                            >
                                {loadingEmail ? <Loader2 size={18} className="animate-spin" /> : "Nhận mã khôi phục"}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: Input OTP & New Password */}
                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in">
                            <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 py-2 px-3 rounded-xl border border-green-100 mb-4">
                                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                                <span>Mã gửi tới: <strong>{email}</strong></span>
                            </div>

                            <div>
                                <label className="text-gray-600 font-medium text-sm ml-1 mb-1 block">Mã Xác Nhận (OTP)</label>
                                <div className="flex justify-between gap-2">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full text-center tracking-[0.4em] text-lg font-bold border border-pink-200 bg-white py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-gray-600 font-medium text-sm ml-1 mb-1 block">Mật Khẩu Mới</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
                                    <input
                                        type="password"
                                        placeholder="Mật khẩu ít nhất 6 ký tự"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full border border-pink-100 bg-gray-50/50 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-gray-600 font-medium text-sm ml-1 mb-1 block">Xác Nhận Mật Khẩu</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
                                    <input
                                        type="password"
                                        placeholder="Nhập lại mật khẩu"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full border border-pink-100 bg-gray-50/50 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingReset || !otp}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-60 text-white py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2 font-semibold"
                            >
                                {loadingReset ? <Loader2 size={18} className="animate-spin" /> : "Đặt lại mật khẩu"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Back to Login */}
                <div className="relative z-10 text-center mt-8 pt-4 border-t border-gray-100">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-pink-500 transition-colors">
                        <ArrowLeft size={16} /> Quay lại trang đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
