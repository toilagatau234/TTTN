import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Login/LoginPage';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import OrderPage from '../pages/Order';
import CustomersPage from '../pages/Customers';
import NotFoundPage from '../components/NotFoundPage';
import ProductPage from '../pages/Products';
import CreateProduct from '../pages/Products/CreateProduct';
import CategoryPage from '../pages/Categories';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />

      {/* Các trang quản trị nằm TRONG Layout */}
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="orders" element={<OrderPage />} />

        <Route path="customers" element={<CustomersPage />} />

        <Route path="categories" element={<CategoryPage />} />

        <Route path="products" element={<ProductPage />} />
        <Route path="products/create" element={<CreateProduct />} />

        {/* Redirect mặc định về Login */}
        <Route path="/" element={<Navigate to="login" replace />} />
      </Route>

      {/* Xử lý đường dẫn sai 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;