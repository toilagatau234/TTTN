import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './client_pages/components/common/ScrollToTop';

import AdminRoutes from './admin_pages/routes/routes';
import UserLayout from './client_pages/layouts/UserLayout';

// User Components & Pages
import Banner from './client_pages/components/common/user/Banner/Banner';
import Home from './client_pages/pages/Home/Home';
import Cart from './client_pages/pages/Cart/Cart';
import Checkout from './client_pages/pages/Checkout/Checkout';
import HydrangeaStudio from './client_pages/pages/HydrangeaStudio/HydrangeaStudio';
import MiniGame from './client_pages/pages/MiniGame/MiniGame';
import ProductDetail from './client_pages/pages/ProductDetail/ProductDetail';
import Profile from './client_pages/pages/Profile/Profile';
import Shop from './client_pages/pages/Shop/Shop';
import Wishlist from './client_pages/pages/Wishlist/Wishlist';
import Auth from './client_pages/pages/Auth/Auth';
import Login from './client_pages/pages/Auth/Login/Login';
import Register from './client_pages/pages/Auth/Register/Register';
import AccountLocked from './client_pages/pages/Auth/AccountLocked/AccountLocked';
import ForgotPassword from './client_pages/pages/Auth/ForgotPassword/ForgotPassword';
import Error from './client_pages/pages/Error/Error';
import BlogDetail from './client_pages/pages/Blog/BlogDetail';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ===== ADMIN ===== */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* ===== USER (CLIENT) ===== */}
        {/* Tất cả user routes liệt kê CỤ THỂ bên trong UserLayout */}
        <Route element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="customDesign" element={<HydrangeaStudio />} />
          <Route path="miniGame" element={<MiniGame />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="shop" element={<Shop />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="auth" element={<Auth />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="account-locked" element={<AccountLocked />} />
        </Route>

        {/* 404 — trong UserLayout */}
        <Route element={<UserLayout />}>
          <Route path="*" element={<Error />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;