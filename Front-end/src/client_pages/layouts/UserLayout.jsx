import { Outlet } from "react-router-dom";
import Navbar from "../components/common/user/Navbar/Navbar";
import Footer from "../components/common/user/Footer/Footer";

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
        </>
    );
};

export default UserLayout;
