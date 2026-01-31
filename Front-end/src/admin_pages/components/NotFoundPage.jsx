import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Kiểm tra xem người dùng đang lạc ở khu vực Admin hay Client
    const isAdminRoute = location.pathname.startsWith('/admin');

    const handleBackHome = () => {
        if (isAdminRoute) {
            navigate('/admin/dashboard'); // Nếu đang ở admin thì về dashboard admin
        } else {
            navigate('/'); // Nếu đang ở client thì về trang chủ client
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
            <Result
                status="404"
                title={<span className="text-navy-700 font-bold text-8xl">404</span>}
                subTitle={<span className="text-gray-500 text-lg">Xin lỗi, trang bạn tìm kiếm không tồn tại.</span>}
                extra={
                    <Button
                        type="primary"
                        onClick={handleBackHome}
                        className="bg-brand-500 h-12 px-8 rounded-xl text-lg font-medium shadow-brand-500/50 border-none"
                    >
                        {isAdminRoute ? 'Quay lại Dashboard' : 'Về Trang chủ'}
                    </Button>
                }
            />
        </div>
    );
};

export default NotFoundPage;