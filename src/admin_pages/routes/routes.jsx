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

        <Route path="minigames" element={<MinigamePage />} />
        <Route path="minigames/:id" element={<GameDetail />} />

        <Route path="products" element={<ProductPage />} />
        <Route path="products/create" element={<CreateProduct />} />

        <Route path="settings" element={<SettingsPage />} />

        <Route path="vouchers" element={<VoucherPage />} />

        <Route path="reviews" element={<ReviewsPage />} />

        <Route path="chat" element={<ChatPage />} />

        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/create-import" element={<CreateImport />} />
        <Route path="inventory/suppliers" element={<Suppliers />} />
        <Route path="inventory/adjustment" element={<StockAdjustment />} />

        <Route path="activity-logs" element={<ActivityLogsPage />} />

        <Route path="cms/banners" element={<BannerPage />} />
        <Route path="cms/blogs" element={<BlogPage />} />

        {/* Redirect mặc định về Login */}
        <Route path="/" element={<Navigate to="login" replace />} />
      </Route>

      {/* Xử lý đường dẫn sai 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;