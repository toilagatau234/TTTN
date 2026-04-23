/**
 * seed_bouquet_items.js
 * Thêm sample items vào DB để test AI Bouquet Builder
 * Run: node seed_bouquet_items.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Lấy hoặc tạo category
    let cat = await Category.findOne({ name: 'Thành phần giỏ hoa' });
    if (!cat) {
        cat = await Category.create({ name: 'Thành phần giỏ hoa', description: 'Các thành phần để tạo giỏ hoa tùy chỉnh' });
        console.log('Created category:', cat.name);
    }

    const items = [
        // Baskets
        { name: 'Giỏ mây tròn truyền thống', product_type: 'basket', price: 120000, stock: 50, description: 'Giỏ mây tự nhiên hình tròn, bền đẹp', dominant_color: 'nâu', layout: 'round' },
        { name: 'Lẵng tre vuông sang trọng', product_type: 'basket', price: 180000, stock: 30, description: 'Lẵng tre hình vuông phong cách hiện đại', dominant_color: 'nâu nhạt', layout: 'square' },
        { name: 'Hộp giấy kraft oval', product_type: 'basket', price: 80000, stock: 100, description: 'Hộp giấy kraft hình oval đơn giản', dominant_color: 'nâu', layout: 'oval' },

        // Wrappers
        { name: 'Giấy gói hồng nhạt matte', product_type: 'wrapper', price: 25000, stock: 200, description: 'Giấy gói màu hồng nhạt, bề mặt matte', dominant_color: 'hồng', style: ['lãng mạn'] },
        { name: 'Giấy cellophane trong suốt', product_type: 'wrapper', price: 15000, stock: 500, description: 'Giấy cellophane trong suốt làm nổi bật hoa', dominant_color: 'trong suốt' },
        { name: 'Vải tulle trắng', product_type: 'wrapper', price: 35000, stock: 150, description: 'Vải tulle mềm mại màu trắng', dominant_color: 'trắng', style: ['sang trọng'] },

        // Ribbons
        { name: 'Ruy băng satin trắng', product_type: 'ribbon', price: 18000, stock: 300, description: 'Ruy băng satin bóng màu trắng', dominant_color: 'trắng' },
        { name: 'Ruy băng organza hồng', product_type: 'ribbon', price: 22000, stock: 200, description: 'Ruy băng organza trong màu hồng', dominant_color: 'hồng' },
        { name: 'Nơ vàng kim tuyến', product_type: 'ribbon', price: 30000, stock: 100, description: 'Nơ vàng lấp lánh kim tuyến', dominant_color: 'vàng', style: ['sang trọng'] },

        // Main flowers
        { name: 'Hoa hồng đỏ nhung Ecuador', product_type: 'flower_component', role_type: 'main_flower', price: 25000, stock: 100, description: 'Hoa hồng đỏ nhung nhập khẩu Ecuador', dominant_color: 'đỏ', main_flowers: ['hoa hồng'], occasion: ['sinh nhật', 'valentine', 'kỷ niệm'] },
        { name: 'Hoa hồng hồng phấn Đà Lạt', product_type: 'flower_component', role_type: 'main_flower', price: 18000, stock: 80, description: 'Hoa hồng hồng phấn trồng tại Đà Lạt', dominant_color: 'hồng', main_flowers: ['hoa hồng'], occasion: ['sinh nhật', 'tốt nghiệp'] },
        { name: 'Hoa cúc vàng tươi', product_type: 'flower_component', role_type: 'main_flower', price: 8000, stock: 200, description: 'Hoa cúc vàng tươi mát', dominant_color: 'vàng', main_flowers: ['hoa cúc'], occasion: ['khai trương', 'sinh nhật'] },
        { name: 'Hoa ly trắng thơm', product_type: 'flower_component', role_type: 'main_flower', price: 35000, stock: 60, description: 'Hoa ly trắng hương thơm nhẹ nhàng', dominant_color: 'trắng', main_flowers: ['hoa ly'], occasion: ['sinh nhật', 'đám cưới', 'chia buồn'] },
        { name: 'Hướng dương vàng rực rỡ', product_type: 'flower_component', role_type: 'main_flower', price: 20000, stock: 120, description: 'Hướng dương vàng tươi rực rỡ', dominant_color: 'vàng', main_flowers: ['hướng dương'], occasion: ['khai trương', 'sinh nhật'] },

        // Sub flowers
        { name: 'Baby breath trắng', product_type: 'flower_component', role_type: 'sub_flower', price: 12000, stock: 300, description: 'Hoa baby breath trắng li ti', dominant_color: 'trắng', sub_flowers: ['baby breath'] },
        { name: 'Lá eucalyptus xanh', product_type: 'flower_component', role_type: 'sub_flower', price: 10000, stock: 200, description: 'Lá eucalyptus xanh thơm nhẹ', dominant_color: 'xanh', sub_flowers: ['eucalyptus'] },
        { name: 'Hoa lavender tím', product_type: 'flower_component', role_type: 'sub_flower', price: 15000, stock: 100, description: 'Hoa lavender tím thơm dịu', dominant_color: 'tím', sub_flowers: ['lavender'] },

        // Accessories
        { name: 'Thiệp chúc mừng sinh nhật', product_type: 'accessory', price: 15000, stock: 500, description: 'Thiệp chúc mừng sinh nhật xinh xắn', occasion: ['sinh nhật'] },
        { name: 'Gấu bông nhỏ', product_type: 'accessory', price: 45000, stock: 80, description: 'Gấu bông nhỏ dễ thương đi kèm hoa' },
        { name: 'Nến thơm mini', product_type: 'accessory', price: 35000, stock: 60, description: 'Nến thơm mini trang trí' },
    ];

    let created = 0;
    for (const item of items) {
        const exists = await Product.findOne({ name: item.name });
        if (!exists) {
            await Product.create({
                ...item,
                category: cat._id,
                images: [{ url: 'https://placehold.co/300x300?text=🌸', publicId: 'placeholder' }],
                sold: Math.floor(Math.random() * 50),
                status: 'active',
                occasion: item.occasion || [],
                style: item.style || [],
            });
            created++;
            console.log(`  ✅ Created: ${item.name} [${item.product_type}]`);
        } else {
            console.log(`  ⏭️  Skip (exists): ${item.name}`);
        }
    }

    console.log(`\n✅ Seeded ${created} new items`);
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
