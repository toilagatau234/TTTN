import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Login/LoginPage';
import Dashboard from '../pages/Dashboard'; // Trang Dashboard bạn vừa làm

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Cấu hình:
         - Đường dẫn thực tế: /admin/login
         - Đường dẫn thực tế: /admin/dashboard
      */}
      <Route path="login" element={<LoginPage />} />
      <Route path="dashboard" element={<Dashboard />} />

      {/* Mặc định vào /admin thì chuyển hướng sang login */}
      <Route path="/" element={<Navigate to="login" replace />} />
      
      {/* Nhập linh tinh sau /admin/... cũng về login */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default AdminRoutes;