// Back-end/controllers/aiOrder.controller.js
const Product = require('../models/Product');
const Cart = require('../models/Cart');

exports.addCustomItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { entities, imageUrl } = req.body;

        const flowerRegex = new RegExp(entities.flower || 'hoa', 'i');

        // 1. Kiểm tra lại kho (giống Bước 2)
        const matchingFlowers = await Product.find({
            name: { $regex: flowerRegex }
        }).limit(1);

        let components = [];
        let componentsTotal = 0;

        if (matchingFlowers.length > 0) {
            const mainFlower = matchingFlowers[0];
            const qty = 10;
            
            // Double check stock
            if (mainFlower.stock < qty) {
                return res.status(400).json({
                    success: false,
                    message: `Rất tiếc! Mẫu hoa "${mainFlower.name}" trong kho hiện không đủ số lượng để kết giỏ.`
                });
            }

            componentsTotal += mainFlower.price * qty;
            components.push({
                item: mainFlower.name,
                qty: qty,
                unitPrice: mainFlower.price,
                totalPrice: mainFlower.price * qty
            });
        } else {
            componentsTotal += 300000;
            components.push({
                item: `Hoa mix tông ${entities.color || 'tự nhiên'} (Giao ngẫu nhiên theo kho)`,
                qty: 1,
                unitPrice: 300000,
                totalPrice: 300000
            });
        }

        // Add wrapper
        componentsTotal += 50000;
        components.push({
            item: `Giấy gói cao cấp & Phụ kiện`,
            qty: 1,
            unitPrice: 50000,
            totalPrice: 50000
        });

        const baseFee = 50000;
        const finalPrice = componentsTotal + baseFee;

        // 2. Tạo Custom Cart Item 
        const customItem = {
            isCustom: true,
            name: `Giỏ hoa thiết kế AI - ${entities.flower || 'Độc bản'}`,
            image: imageUrl || "",
            price: finalPrice,
            quantity: 1,
            components: components,
            baseFee: baseFee,
            note: `Tông màu: ${entities.color || 'Tự nhiên'}`
        };

        // 3. Thêm vào Cart
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
        console.error('Lỗi Add Custom Cart AI:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi thêm giỏ hoa AI vào giỏ hàng.'
        });
    }
};
