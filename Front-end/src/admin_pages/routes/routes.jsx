import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from '../pages/Login/LoginPage';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import OrderPage from '../pages/Order';
import CustomersPage from '../pages/Customers';
import CategoryPage from '../pages/Categories';
import SettingsPage from '../pages/Settings';
import NotFoundPage from '../components/NotFoundPage';
import VoucherPage from '../pages/Vouchers';
import ReviewsPage from '../pages/Reviews';
import ChatPage from '../pages/Chat';

import InventoryPage from '../pages/Inventory';
import CreateImport from '../pages/Inventory/CreateImport';
import Suppliers from '../pages/Inventory/Suppliers';
import StockAdjustment from '../pages/Inventory/StockAdjustment';

import ProductPage from '../pages/Products';
import CreateProduct from '../pages/Products/CreateProduct';

import MinigamePage from '../pages/Minigame';
import GameDetail from '../pages/Minigame/GameDetail';

import ActivityLogsPage from '../pages/ActivityLogs';

import BannerPage from '../pages/CMS/BannerPage';
import BlogPage from '../pages/CMS/BlogPage';

import ShippingPage from '../pages/Shipping';
import CarrierConfig from '../pages/Shipping/CarrierConfig';

import StaffPage from '../pages/Staff/index';

// --- 1. Component Bảo vệ (Guard) ---
// Nhiệm vụ: Kiểm tra xem có token trong localStorage không?
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Nếu không có user hoặc không có token -> Đá về Login
  if (!user || !user.token) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Nếu đã login -> Cho phép truy cập (Render nội dung bên trong)
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      {/* --- Route Công khai (Public) --- */}
      <Route path="login" element={<LoginPage />} />

      {/* --- Route Được Bảo Vệ (Private) --- */}
      {/* Bọc AdminLayout bằng ProtectedRoute */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />

        {/* Nhóm Kinh doanh */}
        <Route path="orders" element={<OrderPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="vouchers" element={<VoucherPage />} />

        {/* Nhóm Hàng hóa */}
        <Route path="categories" element={<CategoryPage />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="products/create" element={<CreateProduct />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/create-import" element={<CreateImport />} />
        <Route path="inventory/suppliers" element={<Suppliers />} />
        <Route path="inventory/adjustment" element={<StockAdjustment />} />

        {/* Nhóm Marketing & CSKH */}
        <Route path="minigames" element={<MinigamePage />} />
        <Route path="minigames/:id" element={<GameDetail />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="cms/banners" element={<BannerPage />} />
        <Route path="cms/blogs" element={<BlogPage />} />

        {/* Nhóm Hệ thống & Vận chuyển */}
        <Route path="shipping" element={<ShippingPage />} />
        <Route path="shipping/config" element={<CarrierConfig />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Redirect mặc định: Vào /admin thì nhảy sang dashboard */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Xử lý đường dẫn sai 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;