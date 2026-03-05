import { Outlet } from "react-router-dom";
import Navbar from "../components/common/user/Navbar/Navbar";
import Footer from "../components/common/user/Footer/Footer";
import ChatWidget from "../components/common/user/ChatWidget/ChatWidget";

/**
 * UserLayout — giao diện khách hàng.
 * Dùng <Outlet /> thay vì <Routes> nội bộ.
 * Tất cả user routes được mở từ App.jsx (flat routing).
 */
const UserLayout = () => {
    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
            {/* Tích hợp Chatbot AI vào toàn bộ các trang của Client */}
            <ChatWidget />
        </>
    );
};

export default UserLayout;
