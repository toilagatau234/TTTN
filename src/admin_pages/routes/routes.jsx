import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Login/LoginPage';
import Dashboard from '../pages/Dashboard';
import OrderPage from '../pages/Order';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* - Đường dẫn thực tế: /admin/login */}
      <Route path="login" element={<LoginPage />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="orders" element={<OrderPage />} />

      {/* Mặc định vào /admin thì chuyển hướng sang login */}
      <Route path="/" element={<Navigate to="login" replace />} />
      
      {/* Nhập linh tinh sau /admin/... cũng về login */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default AdminRoutes;