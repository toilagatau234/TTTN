import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';

const AccountLocked = () => {
    return (
        <div className="min-h-[85vh] bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl p-10 relative overflow-hidden border border-red-100">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-100 rounded-full opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-pink-100 rounded-full opacity-50 blur-3xl"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    
                    {/* Icon Container */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-70"></div>
                        <div className="w-24 h-24 bg-gradient-to-tr from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200 relative z-10">
                            <ShieldAlert className="text-white w-12 h-12" />
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">Tài Khoản Bị Khoá</h1>
                    
                    <p className="text-gray-500 text-base leading-relaxed mb-8 px-4">
                        Rất tiếc, tài khoản của bạn hiện đang bị tạm khóa do vi phạm chính sách hoặc theo quyết định từ quản trị viên. Việc truy cập tạm thời bị gián đoạn.
                    </p>
                    
                    {/* Contact Info Card */}
                    <div className="w-full bg-red-50 rounded-2xl p-6 mb-8 border border-red-100 flex items-start gap-4 text-left">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <Mail className="text-red-500 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 mb-1">Cần hỗ trợ?</h3>
                            <p className="text-red-700 text-sm mb-2">Vui lòng liên hệ với bộ phận CSKH để biết thêm chi tiết và yêu cầu mở khoá.</p>
                            <a href="mailto:support@rosee.com.vn" className="font-semibold text-red-600 hover:text-red-800 transition-colors">
                                support@rosee.com.vn
                            </a>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="w-full flex flex-col sm:flex-row gap-4">
                        <Link 
                            to="/" 
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all border border-gray-200 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" /> Về trang chủ
                        </Link>
                        <Link 
                            to="/login"
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-red-200"
                        >
                            <Lock className="w-5 h-5" /> Đăng nhập
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AccountLocked;
