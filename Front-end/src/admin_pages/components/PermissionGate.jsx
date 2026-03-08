import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PermissionGate = ({ children }) => {
    const location = useLocation();
    
    // Lấy thông tin user từ localStorage một cách an toàn
    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            user = JSON.parse(userStr);
        }
    } catch (error) {
        console.error("Lỗi đọc dữ liệu user từ LocalStorage:", error);
        localStorage.removeItem('user'); // Xóa luôn rác đi cho sạch
    }

    // 1. Kiểm tra chưa đăng nhập (không có user hoặc không có token)
    if (!user || !user.token) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // 2. Kiểm tra quyền (Chỉ cho phép Admin hoặc Staff)
    const allowedRoles = ['Admin', 'Staff'];
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3. Hợp lệ -> Cho phép qua cổng
    return children;
};

export default PermissionGate;