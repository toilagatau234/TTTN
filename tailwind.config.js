/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Bộ màu lấy từ Metrix SaaS Dashboard
                brand: {
                    50: '#E9E3FF',
                    100: '#C0B0FA',
                    200: '#9E85F5',
                    300: '#7B5BEF',
                    400: '#643CEB',
                    500: '#4318FF', // Màu chính (Primary Button)
                    600: '#3A16D9',
                    700: '#2E10B2',
                    800: '#230C8B',
                    900: '#180765',
                },
                navy: {
                    50: '#ECEFF8',
                    100: '#D8DEEE',
                    200: '#B4C0DE',
                    300: '#8F9FB9',
                    400: '#6B7E9F',
                    500: '#475D84',
                    600: '#334262',
                    700: '#2B3674', // Màu chữ tiêu đề (Heading)
                    800: '#1B254B', // Sidebar dark
                    900: '#111C44',
                },
                light: {
                    primary: '#F4F7FE', // Màu nền trang (Background)
                    secondary: '#FFFFFF', // Màu nền thẻ (Card)
                }
            },
            fontFamily: {
                // Metrix dùng font DM Sans hoặc Poppins, ta dùng sans mặc định cho an toàn trước
                sans: ['"DM Sans"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
