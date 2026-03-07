// Back-end/controllers/cartController.js
const Product = require('../models/Product');
const Cart = require('../models/Cart'); // Giả định bạn có model Cart

exports.addCustomBouquetToCart = async (req, res) => {
    try {
        // userId lấy từ token (middleware xác thực)
        const { userId } = req.user; 
        const { entities, imageUrl } = req.body;

        // 1. RAG MAPPING: Tìm kiếm nguyên liệu thật trong kho (MongoDB)
        // Tìm hoa chính (Dùng Regex để match gần đúng, VD: "hoa hồng" sẽ match "Hoa hồng Đà Lạt")
        const flowerRegex = new RegExp(entities.flower || 'hoa', 'i');
        const colorRegex = new RegExp(entities.color || '', 'i');

        // Tìm sản phẩm khớp loại hoa và màu sắc
        const matchingFlowers = await Product.find({
            category: 'nguyen-lieu', // Giả sử bạn phân loại nguyên liệu
            name: { $regex: flowerRegex },
            tags: { $regex: colorRegex }
        }).limit(3);

        // 2. Tính toán giá (Business Logic)
        let basePrice = 150000; // Giá tối thiểu cho 1 giỏ/lẵng rỗng, xốp cắm...
        let materials = [];

        if (matchingFlowers.length > 0) {
            // Lấy hoa đầu tiên tìm được làm hoa chủ đạo
            const mainFlower = matchingFlowers[0];
            basePrice += (mainFlower.price * 10); // Giả sử lẵng cần 10 bông
            materials.push({
                productId: mainFlower._id,
                name: mainFlower.name,
                quantity: 10,
                price: mainFlower.price
            });
        } else {
            // Fallback: Nếu kho không có màu/loại hoa chính xác, dùng hoa mặc định
            basePrice += 300000; // Tạm tính giá một giỏ hoa mix ngẫu nhiên
            materials.push({ name: `Hoa mix tông ${entities.color || 'tự do'} (Giao ngẫu nhiên theo kho)`, quantity: 1, price: 300000 });
        }

        // 3. Tạo Custom Cart Item
        const customItem = {
            isCustom: true,
            name: `Giỏ hoa thiết kế AI - ${entities.flower || 'Độc bản'}`,
            image: imageUrl, // Ảnh do Gemini sinh ra
            price: basePrice,
            quantity: 1,
            materials: materials, // Lưu lại cấu thành để Admin/Florist biết đường cắm
            note: `Tông màu: ${entities.color}`
        };

        // 4. Lưu vào Giỏ hàng của User
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        
        cart.items.push(customItem);
        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Đã thêm lẵng hoa AI vào giỏ hàng!',
            data: customItem
        });

    } catch (error) {
        console.error("Lỗi Add to Cart AI:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm vào giỏ hàng.' });
    }
};