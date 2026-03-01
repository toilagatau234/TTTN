import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminRoutes from './admin_pages/routes/routes';
import UserLayout from './client_pages/layouts/UserLayout';

// User Components & Pages
import Banner from './client_pages/components/common/user/Banner/Banner';
import Home from './client_pages/pages/Home/Home';
import Cart from './client_pages/pages/Cart/Cart';
import Checkout from './client_pages/pages/Checkout/Checkout';
import CustomDesign from './client_pages/pages/CustomDesign/CustomDesign';
import MiniGame from './client_pages/pages/MiniGame/MiniGame';
import ProductDetail from './client_pages/pages/ProductDetail/ProductDetail';
import Profile from './client_pages/pages/Profile/Profile';
import Shop from './client_pages/pages/Shop/Shop';
import Wishlist from './client_pages/pages/Wishlist/Wishlist';
import Mess from './client_pages/pages/Mess/Mess';
import Auth from './client_pages/pages/Auth/Auth';
import Login from './client_pages/pages/Auth/Login/Login';
import Register from './client_pages/pages/Auth/Register/Register';
import Error from './client_pages/pages/Error/Error';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== ADMIN ===== */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* ===== USER (CLIENT) ===== */}
        {/* Tất cả user routes liệt kê CỤ THỂ bên trong UserLayout */}
        <Route element={<UserLayout />}>
          <Route index element={<><Banner /><Home /></>} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="customDesign" element={<CustomDesign />} />
          <Route path="miniGame" element={<MiniGame />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="shop" element={<Shop />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="mess" element={<Mess />} />
          <Route path="auth" element={<Auth />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
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