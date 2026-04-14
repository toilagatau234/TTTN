import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { ROLES } from '../../constants/roles';

const PermissionGate = ({ children }) => {
    const location = useLocation();
    
    // Lấy thông tin user an toàn
    const user = authService.getCurrentUser();

    // 1. Kiểm tra chưa đăng nhập (không có user hoặc không có token)
    if (!user || !user.token) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // 2. Kiểm tra quyền dữa trên các role hợp lệ cho Admin Panel
    const allowedRoles = [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE, ROLES.STAFF];
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3. Hợp lệ -> Cho phép qua cổng
    return children;
};

export default PermissionGate;