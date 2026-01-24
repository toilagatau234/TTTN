import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Login/LoginPage';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import OrderPage from '../pages/Order';
import NotFoundPage from '../components/NotFoundPage';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Trang Login nằm ngoài Layout (Không có sidebar) */}
      <Route path="login" element={<LoginPage />} />

      {/* Các trang quản trị nằm TRONG Layout */}
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<OrderPage />} />

        {/* Redirect mặc định về Login */}
        <Route path="/" element={<Navigate to="login" replace />} />
      </Route>

      {/* Xử lý đường dẫn sai */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;