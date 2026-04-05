import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const PermissionGate = ({ children }) => {
    const location = useLocation();
    
    // Lấy thông tin user an toàn
    const user = authService.getCurrentUser();

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