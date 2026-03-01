import UserLayout from "../layouts/UserLayout";

/**
 * ClientRoutes — renders UserLayout directly.
 * UserLayout itself contains all user-facing <Routes>.
 * Được mount tại path="/*" trong App.jsx
 */
const ClientRoutes = () => {
    return <UserLayout />;
};

export default ClientRoutes;
