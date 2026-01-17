import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoutes from './admin_pages/routes';

const ClientRoutes = () => <div className="p-10 text-center">Trang Người Dùng (Client Page)</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === CẤU HÌNH ADMIN === */}

        {/* Logic chuyển hướng: Truy cập /admin -> Tự động sang /admin/login */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Load các routes con của Admin từ file cấu hình riêng */}
        <Route path="/admin/*" element={<AdminRoutes />} />


        {/* === CẤU HÌNH CLIENT === */}
        {/* Các đường dẫn dành cho trang người dùng */}
        <Route path="/*" element={<ClientRoutes />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;