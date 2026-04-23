/**
 * seed_comprehensive_products.js
 * Seeder để tạo dữ liệu sản phẩm hoa toàn diện
 * Run: node seed_comprehensive_products.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Kết nối MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

// Tạo hoặc lấy category
async function getOrCreateCategory(name, description) {
    let category = await Category.findOne({ name });
    if (!category) {
        category = await Category.create({ name, description });
        console.log(`✅ Created category: ${name}`);
    } else {
        console.log(`ℹ️ Category already exists: ${name}`);
    }
    return category;
}

// Tạo dữ liệu sản phẩm
async function seedProducts() {
    try {
        // === BƯỚC 1: TẠO CÁC DANH MỤC ===
        const categories = {};

        categories.flowers = await getOrCreateCategory(
            'Hoa Tươi',
            'Các loại hoa tươi nguyên liệu chính'
        );
        categories.bouquets = await getOrCreateCategory(
            'Giỏ Hoa Hoàn Chỉnh',
            'Các bó/giỏ hoa hoàn chỉnh, sẵn sàng sử dụng'
        );
        categories.baskets = await getOrCreateCategory(
            'Giỏ & Lẵng',
            'Giỏ, lẵng, hộp đựng hoa'
        );
        categories.wrappers = await getOrCreateCategory(
            'Giấy Gói & Vải',
            'Giấy gói, vải tulle và vật liệu bao bọc'
        );
        categories.ribbons = await getOrCreateCategory(
            'Ruy Băng & Nơ',
            'Ruy băng, nơ trang trí'
        );
        categories.accessories = await getOrCreateCategory(
            'Phụ Kiện Trang Trí',
            'Thiệp, thú bông, nến, v.v.'
        );

        // === BƯỚC 2: XÓA SỬ PHẨM CŨ (tùy chọn) ===
        // Uncomment dòng dưới để xóa tất cả sản phẩm cũ
        // await Product.deleteMany({});
        // console.log('🗑️ Deleted old products');

        // === BƯỚC 3: TẠO CÁC SẢN PHẨM ===
        const productsData = [
            // ==========================================
            // HỎA TƯƠI - MAIN FLOWERS
            // ==========================================
            {
                name: 'Hoa Hồng Đỏ Nhung Ecuador',
                description: 'Hoa hồng đỏ nhung nhập khẩu từ Ecuador, hương thơm ngọt ngào, độ tươi cao',
                price: 45000,
                originalPrice: 50000,
                stock: 150,
                sold: 45,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'main_flower',
                occasion: ['valentine', 'sinh nhật', 'kỷ niệm', 'lãng mạn'],
                style: ['luxury', 'romantic'],
                main_flowers: ['hoa hồng'],
                dominant_color: 'đỏ',
                secondary_colors: ['xanh lá'],
                elements: ['lá xanh'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&h=500&fit=crop', publicId: 'rose-red-1' }
                ]
            },
            {
                name: 'Hoa Hồng Hồng Phấn Đà Lạt',
                description: 'Hoa hồng hồng phấn trồng tại vùng cao Đà Lạt, độ tươi lâu, cánh mềm mại',
                price: 35000,
                originalPrice: 40000,
                stock: 200,
                sold: 80,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'main_flower',
                occasion: ['sinh nhật', 'tốt nghiệp', 'lãng mạn'],
                style: ['romantic', 'elegant'],
                main_flowers: ['hoa hồng'],
                dominant_color: 'hồng',
                secondary_colors: ['trắng', 'xanh lá'],
                elements: ['lá xanh'],
                status: 'active',
                isHot: false,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1540574163026-643ea346ca3e?w=500&h=500&fit=crop', publicId: 'rose-pink-1' }
                ]
            },
            {
                name: 'Hoa Hồng Trắng Hoa Cúc',
                description: 'Hoa hồng trắng nhập khẩu, tinh tế và thanh lịch, phù hợp các dịp lễ',
                price: 40000,
                originalPrice: 45000,
                stock: 120,
                sold: 50,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'main_flower',
                occasion: ['đám cưới', 'chia buồn', 'lãng mạn'],
                style: ['elegant', 'minimalist'],
                main_flowers: ['hoa hồng'],
                dominant_color: 'trắng',
                secondary_colors: ['xanh lá'],
                elements: ['lá xanh'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1548250084-92e0c88be3c4?w=500&h=500&fit=crop', publicId: 'rose-white-1' }
                ]
            },
            {
                name: 'Hoa Ly Trắng Thơm',
                description: 'Hoa ly trắng hương thơm nhẹ nhàng, tương trưng cho sự tinh khôi và thanh cao',
                price: 55000,
                originalPrice: 65000,
                stock: 80,
                sold: 30,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'main_flower',
                occasion: ['đám cưới', 'chia buồn', 'trang trí'],
                style: ['luxury', 'elegant'],
                main_flowers: ['hoa ly'],
                dominant_color: 'trắng',
                secondary_colors: ['vàng'],
                elements: ['nhị hoa'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1582632335147-9c8e3d1a25aa?w=500&h=500&fit=crop', publicId: 'lily-white-1' }
                ]
            },
            {
                name: 'Hướng Dương Vàng Rực Rỡ',
                description: 'Hướng dương vàng tươi rực rỡ, tượng trưng cho sự vui vẻ và tích cực',
                price: 30000,
                originalPrice: 35000,
                stock: 150,
                sold: 120,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'main_flower',
                occasion: ['khai trương', 'sinh nhật', 'tốt nghiệp'],
                style: ['vibrant', 'casual'],
                main_flowers: ['hướng dương'],
                dominant_color: 'vàng',
                secondary_colors: ['xanh lá'],
                elements: ['lá xanh'],
                status: 'active',
                isHot: true,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1597848848168-e45bb4b8b397?w=500&h=500&fit=crop', publicId: 'sunflower-1' }
                ]
            },
            {
                name: 'Hoa Cúc Vàng Tươi',
                description: 'Hoa cúc vàng tươi mát, giá thành phải chăng, dễ sử dụng trong các bó hoa',
                price: 15000,
                originalPrice: 18000,
                stock: 300,
                sold: 200,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'main_flower',
                occasion: ['khai trương', 'sinh nhật', 'trang trí'],
                style: ['casual', 'vibrant'],
                main_flowers: ['hoa cúc'],
                dominant_color: 'vàng',
                secondary_colors: ['xanh lá'],
                elements: ['lá xanh'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1578970970600-5d0d99f4ab00?w=500&h=500&fit=crop', publicId: 'chrysanthemum-1' }
                ]
            },
            {
                name: 'Hoa Lan Tím Quý Phái',
                description: 'Hoa lan tím nhập khẩu, biểu tượng của sự quý phái và sang trọng',
                price: 70000,
                originalPrice: 85000,
                stock: 60,
                sold: 25,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'main_flower',
                occasion: ['đám cưới', 'khai trương', 'tặng quà'],
                style: ['luxury', 'elegant'],
                main_flowers: ['hoa lan'],
                dominant_color: 'tím',
                secondary_colors: ['trắng'],
                elements: ['lá lan'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1588454620933-0dd9e0247f01?w=500&h=500&fit=crop', publicId: 'orchid-purple-1' }
                ]
            },

            // ==========================================
            // HỎA TƯƠI - SUB FLOWERS
            // ==========================================
            {
                name: 'Baby Breath Trắng (Hoa Thơm)',
                description: 'Hoa baby breath trắng li ti, dùng để làm nền cho các bó hoa, tạo nên vẻ nhẹ nhàng',
                price: 20000,
                originalPrice: 25000,
                stock: 400,
                sold: 250,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'sub_flower',
                occasion: ['lãng mạn', 'đám cưới', 'sinh nhật'],
                style: ['romantic', 'elegant'],
                sub_flowers: ['baby breath'],
                dominant_color: 'trắng',
                secondary_colors: ['xanh lá'],
                elements: ['lá mồng'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1552486647-e74d440fc138?w=500&h=500&fit=crop', publicId: 'baby-breath-1' }
                ]
            },
            {
                name: 'Lá Eucalyptus Xanh Thơm',
                description: 'Lá eucalyptus xanh bạc có hương thơm nhẹ, dùng để tạo kết cấu trong các bó hoa',
                price: 15000,
                originalPrice: 18000,
                stock: 250,
                sold: 180,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'sub_flower',
                occasion: ['lãng mạn', 'trang trí'],
                style: ['minimalist', 'elegant'],
                sub_flowers: ['eucalyptus'],
                dominant_color: 'xanh bạc',
                secondary_colors: [],
                elements: ['lá'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1568571933382-74d440642117?w=500&h=500&fit=crop', publicId: 'eucalyptus-1' }
                ]
            },
            {
                name: 'Hoa Lavender Tím Thơm',
                description: 'Hoa lavender tím có hương thơm dịu dàng, giúp bó hoa thêm độc đáo và thơm lâu',
                price: 25000,
                originalPrice: 30000,
                stock: 150,
                sold: 95,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'sub_flower',
                occasion: ['lãng mạn', 'sinh nhật'],
                style: ['romantic', 'vintage'],
                sub_flowers: ['lavender'],
                dominant_color: 'tím',
                secondary_colors: ['xanh lá'],
                elements: ['lá'],
                status: 'active',
                isHot: false,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd33c86?w=500&h=500&fit=crop', publicId: 'lavender-1' }
                ]
            },
            {
                name: 'Hoa Mcatalana Hồng Nhạt',
                description: 'Hoa matalana hồng nhạt, có nhiều cánh tạo nên vẻ phồng, dùng để tăng thể tích cho bó',
                price: 22000,
                originalPrice: 26000,
                stock: 180,
                sold: 110,
                category: categories.flowers._id,
                product_type: 'flower_component',
                role_type: 'sub_flower',
                occasion: ['lãng mạn', 'sinh nhật', 'tốt nghiệp'],
                style: ['romantic', 'elegant'],
                sub_flowers: ['matalana'],
                dominant_color: 'hồng',
                secondary_colors: ['xanh lá'],
                elements: ['lá'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1560098040-c4f59c80b6b6?w=500&h=500&fit=crop', publicId: 'matalana-pink-1' }
                ]
            },

            // ==========================================
            // GIỎ & LẴNG
            // ==========================================
            {
                name: 'Giỏ Mây Tròn Truyền Thống',
                description: 'Giỏ mây tự nhiên hình tròn, bền đẹp, phù hợp với mọi loại bó hoa',
                price: 150000,
                originalPrice: 170000,
                stock: 50,
                sold: 35,
                category: categories.baskets._id,
                product_type: 'basket',
                stock: 50,
                dominant_color: 'nâu tự nhiên',
                layout: 'round',
                style: ['traditional', 'casual'],
                occasion: ['tặng quà', 'sinh nhật', 'trang trí'],
                elements: ['xử lý thiên nhiên'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&h=500&fit=crop', publicId: 'basket-round-1' }
                ]
            },
            {
                name: 'Lẵng Tre Vuông Sang Trọng',
                description: 'Lẵng tre hình vuông phong cách hiện đại, phù hợp với các dịp trọng thể',
                price: 220000,
                originalPrice: 250000,
                stock: 35,
                sold: 20,
                category: categories.baskets._id,
                product_type: 'basket',
                dominant_color: 'nâu nhạt',
                layout: 'square',
                style: ['luxury', 'modern'],
                occasion: ['khai trương', 'đám cưới', 'tặng quà'],
                elements: ['xử lý cao cấp'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&h=500&fit=crop', publicId: 'basket-square-1' }
                ]
            },
            {
                name: 'Hộp Giấy Kraft Oval',
                description: 'Hộp giấy kraft hình oval, phong cách tối giản hiện đại, dễ sử dụng',
                price: 85000,
                originalPrice: 95000,
                stock: 100,
                sold: 65,
                category: categories.baskets._id,
                product_type: 'basket',
                dominant_color: 'nâu',
                layout: 'oval',
                style: ['minimalist', 'modern'],
                occasion: ['sinh nhật', 'tặng quà', 'trang trí'],
                elements: ['thiết kế đơn giản'],
                status: 'active',
                isHot: false,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&h=500&fit=crop', publicId: 'box-kraft-oval-1' }
                ]
            },
            {
                name: 'Giỏ Gỗ Xoan Đào Cao Cấp',
                description: 'Giỏ gỗ xoan đào cao cấp, đẹp mắt, bền vững, tạo ấn tượng sang trọng',
                price: 350000,
                originalPrice: 400000,
                stock: 25,
                sold: 12,
                category: categories.baskets._id,
                product_type: 'basket',
                dominant_color: 'nâu đỏ',
                layout: 'round',
                style: ['luxury', 'premium'],
                occasion: ['khai trương', 'đám cưới', 'tặng quà VIP'],
                elements: ['gỗ xoan đào nguyên khối'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=500&fit=crop', publicId: 'basket-wood-premium-1' }
                ]
            },

            // ==========================================
            // GIẤY GÓI & VẢI
            // ==========================================
            {
                name: 'Giấy Gói Hồng Nhạt Matte',
                description: 'Giấy gói màu hồng nhạt, bề mặt matte, dễ bọc, phù hợp các bó hoa lãng mạn',
                price: 35000,
                originalPrice: 40000,
                stock: 200,
                sold: 150,
                category: categories.wrappers._id,
                product_type: 'wrapper',
                dominant_color: 'hồng',
                style: ['romantic', 'elegant'],
                occasion: ['lãng mạn', 'sinh nhật'],
                elements: ['matte finish'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1577720643272-265dc37ee3d6?w=500&h=500&fit=crop', publicId: 'paper-pink-1' }
                ]
            },
            {
                name: 'Giấy Cellophane Trong Suốt',
                description: 'Giấy cellophane trong suốt cao cấp, giúp nổi bật vẻ đẹp của hoa',
                price: 20000,
                originalPrice: 25000,
                stock: 500,
                sold: 400,
                category: categories.wrappers._id,
                product_type: 'wrapper',
                dominant_color: 'trong suốt',
                style: ['minimalist', 'elegant'],
                occasion: ['trang trí', 'lãng mạn'],
                elements: ['transparent', 'eco-friendly'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1595857526589-6d88ceb7c729?w=500&h=500&fit=crop', publicId: 'cellophane-transparent-1' }
                ]
            },
            {
                name: 'Vải Tulle Trắng Sang Trọng',
                description: 'Vải tulle mềm mại màu trắng, tạo nên vẻ sang trọng và tinh tế cho bó hoa',
                price: 45000,
                originalPrice: 55000,
                stock: 150,
                sold: 95,
                category: categories.wrappers._id,
                product_type: 'wrapper',
                dominant_color: 'trắng',
                style: ['luxury', 'elegant'],
                occasion: ['lãng mạn', 'đám cưới'],
                elements: ['tulle fabric'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1577720643272-265dc37ee3d6?w=500&h=500&fit=crop', publicId: 'tulle-white-1' }
                ]
            },
            {
                name: 'Giấy Gói Xanh Navy Hiện Đại',
                description: 'Giấy gói xanh navy với kiểu dáng hiện đại, phù hợp cho các dịp chuyên nghiệp',
                price: 30000,
                originalPrice: 35000,
                stock: 180,
                sold: 120,
                category: categories.wrappers._id,
                product_type: 'wrapper',
                dominant_color: 'xanh navy',
                style: ['modern', 'professional'],
                occasion: ['tặng quà', 'trang trí'],
                elements: ['modern design'],
                status: 'active',
                isHot: false,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1577720643272-265dc37ee3d6?w=500&h=500&fit=crop', publicId: 'paper-navy-1' }
                ]
            },

            // ==========================================
            // RUY BĂNG & NƠ
            // ==========================================
            {
                name: 'Ruy Băng Satin Trắng',
                description: 'Ruy băng satin bóng màu trắng, độ rộng 2cm, phù hợp trang trí bó hoa',
                price: 22000,
                originalPrice: 25000,
                stock: 300,
                sold: 200,
                category: categories.ribbons._id,
                product_type: 'ribbon',
                dominant_color: 'trắng',
                style: ['elegant', 'classic'],
                occasion: ['lãng mạn', 'đám cưới'],
                elements: ['satin ribbon'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1566897777294-bf6f96e88003?w=500&h=500&fit=crop', publicId: 'ribbon-satin-white-1' }
                ]
            },
            {
                name: 'Ruy Băng Organza Hồng',
                description: 'Ruy băng organza trong màu hồng, tạo nên vẻ nhẹ nhàng và lãng mạn',
                price: 28000,
                originalPrice: 32000,
                stock: 250,
                sold: 160,
                category: categories.ribbons._id,
                product_type: 'ribbon',
                dominant_color: 'hồng',
                style: ['romantic', 'elegant'],
                occasion: ['lãng mạn', 'sinh nhật'],
                elements: ['organza ribbon'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1566897777294-bf6f96e88003?w=500&h=500&fit=crop', publicId: 'ribbon-organza-pink-1' }
                ]
            },
            {
                name: 'Nơ Vàng Kim Tuyến Sang Trọng',
                description: 'Nơ vàng lấp lánh kim tuyến, tạo nên điểm nhấn sang trọng cho bó hoa',
                price: 38000,
                originalPrice: 45000,
                stock: 100,
                sold: 65,
                category: categories.ribbons._id,
                product_type: 'ribbon',
                dominant_color: 'vàng',
                style: ['luxury', 'elegant'],
                occasion: ['khai trương', 'tặng quà VIP'],
                elements: ['glitter', 'bow'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&h=500&fit=crop', publicId: 'bow-gold-glitter-1' }
                ]
            },

            // ==========================================
            // PHỤ KIỆN TRANG TRÍ
            // ==========================================
            {
                name: 'Thiệp Tặng Hoa Cao Cấp',
                description: 'Thiệp tặng cao cấp với giấy bề mặt matte, có thể viết lời chúc',
                price: 15000,
                originalPrice: 18000,
                stock: 500,
                sold: 350,
                category: categories.accessories._id,
                product_type: 'accessory',
                dominant_color: 'trắng',
                style: ['elegant', 'classic'],
                occasion: ['tặng quà', 'lãng mạn'],
                elements: ['greeting card'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1611339555312-e607c04352fd?w=500&h=500&fit=crop', publicId: 'card-white-1' }
                ]
            },
            {
                name: 'Gấu Bông Nhỏ Trắng',
                description: 'Gấu bông nhỏ xinh xắn màu trắng, phù hợp để cắm trên bó hoa',
                price: 45000,
                originalPrice: 55000,
                stock: 150,
                sold: 100,
                category: categories.accessories._id,
                product_type: 'accessory',
                dominant_color: 'trắng',
                style: ['cute', 'casual'],
                occasion: ['sinh nhật', 'lãng mạn', 'tặng quà'],
                elements: ['teddy bear', 'cute decoration'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop', publicId: 'teddy-white-1' }
                ]
            },
            {
                name: 'Nến Thơm Hoa Hồng',
                description: 'Nến thơm hương hoa hồng tự nhiên, giúp không gian thêm lãng mạn',
                price: 65000,
                originalPrice: 75000,
                stock: 80,
                sold: 55,
                category: categories.accessories._id,
                product_type: 'accessory',
                dominant_color: 'hồng',
                style: ['romantic', 'luxury'],
                occasion: ['lãng mạn', 'trang trí'],
                elements: ['scented candle'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1590080876472-cd5a9f5e8e2e?w=500&h=500&fit=crop', publicId: 'candle-rose-1' }
                ]
            },
            {
                name: 'Trang Trí Pha Lê Lấp Lánh',
                description: 'Trang trí pha lê lấp lánh, thêm điểm nhấn sang trọng cho bó hoa',
                price: 25000,
                originalPrice: 30000,
                stock: 200,
                sold: 120,
                category: categories.accessories._id,
                product_type: 'accessory',
                dominant_color: 'trong suốt',
                style: ['luxury', 'elegant'],
                occasion: ['khai trương', 'tặng quà VIP'],
                elements: ['crystal beads'],
                status: 'active',
                isHot: false,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop', publicId: 'crystal-beads-1' }
                ]
            },

            // ==========================================
            // GIỎ HÓA HOÀN CHỈNH
            // ==========================================
            {
                name: 'Giỏ Hoa Hồng Đỏ Luxury',
                description: 'Bó hoa hồng đỏ luxury với 12 bông hồng đỏ nhung Ecuador, được sắp xếp tinh tế trong giỏ mây cao cấp',
                price: 650000,
                originalPrice: 750000,
                stock: 20,
                sold: 15,
                category: categories.bouquets._id,
                product_type: 'complete_bouquet',
                occasion: ['valentine', 'kỷ niệm', 'lãng mạn'],
                style: ['luxury', 'romantic'],
                main_flowers: ['hoa hồng đỏ'],
                sub_flowers: ['baby breath'],
                dominant_color: 'đỏ',
                secondary_colors: ['trắng', 'xanh lá'],
                layout: 'round',
                elements: ['ruy băng vàng', 'nơ sang trọng'],
                status: 'active',
                isHot: true,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&h=500&fit=crop', publicId: 'bouquet-red-rose-luxury-1' }
                ]
            },
            {
                name: 'Giỏ Hoa Hạnh Phúc',
                description: 'Bó hoa sắc màu với hướng dương, hoa hồng, hoa cúc tạo nên vẻ vui vẻ và tươi tắn',
                price: 450000,
                originalPrice: 520000,
                stock: 35,
                sold: 25,
                category: categories.bouquets._id,
                product_type: 'complete_bouquet',
                occasion: ['sinh nhật', 'tốt nghiệp', 'tế tựu'],
                style: ['vibrant', 'casual'],
                main_flowers: ['hướng dương', 'hoa hồng', 'hoa cúc'],
                sub_flowers: ['eucalyptus'],
                dominant_color: 'vàng',
                secondary_colors: ['hồng', 'xanh'],
                layout: 'round',
                elements: ['ruy băng organza'],
                status: 'active',
                isHot: true,
                isNewProduct: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd33c86?w=500&h=500&fit=crop', publicId: 'bouquet-happiness-1' }
                ]
            },
            {
                name: 'Giỏ Hoa Ly Trắng Yên Tĩnh',
                description: 'Bó hoa ly trắng sang trọng kết hợp với eucalyptus, tượng trưng cho sự thanh cao và tinh khôi',
                price: 750000,
                originalPrice: 850000,
                stock: 15,
                sold: 10,
                category: categories.bouquets._id,
                product_type: 'complete_bouquet',
                occasion: ['đám cưới', 'chia buồn', 'trang trí'],
                style: ['elegant', 'luxury'],
                main_flowers: ['hoa ly trắng'],
                sub_flowers: ['eucalyptus', 'baby breath'],
                dominant_color: 'trắng',
                secondary_colors: ['xanh bạc'],
                layout: 'cascade',
                elements: ['ruy băng satin trắng', 'thiệp tặng'],
                status: 'active',
                isHot: false,
                isNewProduct: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1582632335147-9c8e3d1a25aa?w=500&h=500&fit=crop', publicId: 'bouquet-lily-white-1' }
                ]
            }
        ];

        // === BƯỚC 4: THÊM HOẶC CẬP NHẬT SẢN PHẨM ===
        let createdCount = 0;
        let updatedCount = 0;

        for (const productData of productsData) {
            const existingProduct = await Product.findOne({ name: productData.name });
            
            if (existingProduct) {
                // Cập nhật sản phẩm nếu đã tồn tại
                await Product.findByIdAndUpdate(existingProduct._id, productData);
                updatedCount++;
                console.log(`✏️ Updated: ${productData.name}`);
            } else {
                // Tạo sản phẩm mới
                await Product.create(productData);
                createdCount++;
                console.log(`✅ Created: ${productData.name}`);
            }
        }

        console.log('\n✨ Seeding completed!');
        console.log(`📝 Created: ${createdCount} new products`);
        console.log(`✏️ Updated: ${updatedCount} existing products`);
        console.log(`📊 Total: ${createdCount + updatedCount} products processed`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

// === CHẠY SEEDER ===
connectDB().then(() => seedProducts());
