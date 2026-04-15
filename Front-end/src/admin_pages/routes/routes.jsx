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
import PermissionGate from '../components/PermissionGate';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Route công khai — không cần đăng nhập */}
      <Route path="login" element={<LoginPage />} />

      {/* Các Routes cần bảo vệ (bọc trong PermissionGate) */}
      <Route
        element={
          <PermissionGate>
            <AdminLayout />
          </PermissionGate>
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
        <Route path="cms/banners" element={<BannerPage />} />
        <Route path="cms/blogs" element={<BlogPage />} />

        {/* Nhóm Hệ thống & Vận chuyển */}
        <Route path="shipping" element={<ShippingPage />} />
        <Route path="shipping/config" element={<CarrierConfig />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Mặc định: /admin → chuyển về /admin/dashboard */}
      {/* (PermissionGate sẽ lo phần bắt lỗi nếu chưa đăng nhập) */}
      <Route index element={<Navigate to="dashboard" replace />} />

      {/* 404 cho admin */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;