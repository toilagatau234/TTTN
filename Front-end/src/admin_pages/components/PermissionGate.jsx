import React from 'react';

// Giả lập lấy user từ LocalStorage
const getCurrentUserRole = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.role : 'Guest';
};

/**
 * @param {Array} allowedRoles - Danh sách các role được phép (VD: ['Admin', 'Manager'])
 * @param {ReactNode} children - Nội dung cần bảo vệ
 */
const PermissionGate = ({ allowedRoles = [], children }) => {
  const currentRole = getCurrentUserRole();
  
  // Nếu role hiện tại nằm trong danh sách cho phép -> Render
  if (allowedRoles.includes(currentRole)) {
    return <>{children}</>;
  }
  
  return null;
};

export default PermissionGate;