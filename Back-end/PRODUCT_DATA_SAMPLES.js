/**
 * PRODUCT_DATA_SAMPLES.js
 * Các mẫu dữ liệu sản phẩm để tham khảo
 * Sử dụng khi cần hiểu cấu trúc dữ liệu chi tiết
 */

// ============================================
// VÍ DỤ 1: HOA CHÍNH (Main Flower)
// ============================================
const mainFlowerExample = {
  name: 'Hoa Hồng Đỏ Nhung Ecuador',
  description: 'Hoa hồng đỏ nhung nhập khẩu từ Ecuador, hương thơm ngọt ngào, độ tươi cao',
  price: 45000,
  originalPrice: 50000,
  stock: 150,
  sold: 45,
  category: ObjectId('507f1f77bcf86cd799439011'),  // Reference tới Category
  
  // === Thuộc tính AI ===
  product_type: 'flower_component',  // Loại sản phẩm
  role_type: 'main_flower',          // Hoa chính (không phải hoa phụ)
  
  // === Phân loại theo dịp tặng ===
  occasion: [
    'valentine',
    'sinh nhật',
    'kỷ niệm',
    'lãng mạn'
  ],
  
  // === Phong cách ===
  style: [
    'luxury',      // Sang trọng cao cấp
    'romantic'     // Lãng mạn
  ],
  
  // === Thành phần hoa ===
  main_flowers: ['hoa hồng'],        // Hoa chính là hoa hồng
  sub_flowers: [],                    // Không có hoa phụ (trường này không dùng cho main flower)
  
  // === Màu sắc ===
  dominant_color: 'đỏ',              // Màu chủ đạo
  secondary_colors: ['xanh lá'],     // Màu phụ
  
  // === Kiểu dáng (layout) ===
  layout: 'round',                    // Hình tròn (có thể: round, square, oval, cascade)
  
  // === Yếu tố trang trí ===
  elements: [
    'lá xanh',                        // Lá trang trí
    'có thể thêm ruy băng nếu là bó'
  ],
  
  // === Hình ảnh ===
  images: [
    {
      url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500',
      publicId: 'rose-red-ecuador-1'
    }
  ],
  
  // === Trạng thái ===
  status: 'active',                  // active, inactive, out_of_stock
  isHot: true,                       // Sản phẩm bán chạy
  isNewProduct: true,                // Sản phẩm mới
  
  // === Đánh giá ===
  averageRating: 4.8,
  numReviews: 45,
  
  // === Thời gian ===
  createdAt: ISODate('2026-04-24T10:30:00Z')
};

// ============================================
// VÍ DỤ 2: HOA PHỤ (Sub Flower)
// ============================================
const subFlowerExample = {
  name: 'Baby Breath Trắng (Hoa Thơm)',
  description: 'Hoa baby breath trắng li ti, dùng để làm nền cho các bó hoa, tạo nên vẻ nhẹ nhàng',
  price: 20000,
  originalPrice: 25000,
  stock: 400,
  sold: 250,
  category: ObjectId('507f1f77bcf86cd799439011'),
  
  product_type: 'flower_component',
  role_type: 'sub_flower',           // Hoa phụ (không phải hoa chính)
  
  occasion: ['lãng mạn', 'đám cưới', 'sinh nhật'],
  style: ['romantic', 'elegant'],
  
  // Lưu ý: Với hoa phụ, main_flowers có thể trống
  main_flowers: [],
  sub_flowers: ['baby breath'],      // Loại hoa phụ
  
  dominant_color: 'trắng',
  secondary_colors: ['xanh lá'],
  
  layout: 'fill',                    // Hoa phụ thường dùng để fill
  elements: ['hoa li ti', 'lá mồng'],
  
  images: [{
    url: 'https://images.unsplash.com/photo-1552486647-e74d440fc138',
    publicId: 'baby-breath-white-1'
  }],
  
  status: 'active',
  isHot: false,
  isNewProduct: false,
  
  averageRating: 4.5,
  numReviews: 32
};

// ============================================
// VÍ DỤ 3: GIỎ (Basket)
// ============================================
const basketExample = {
  name: 'Giỏ Mây Tròn Truyền Thống',
  description: 'Giỏ mây tự nhiên hình tròn, bền đẹp, phù hợp với mọi loại bó hoa',
  price: 150000,
  originalPrice: 170000,
  stock: 50,
  sold: 35,
  category: ObjectId('507f1f77bcf86cd799439012'),  // Category "Giỏ & Lẵng"
  
  product_type: 'basket',            // Loại: giỏ/lẵng
  role_type: null,                   // Giỏ không có role_type
  
  occasion: ['tặng quà', 'sinh nhật', 'trang trí'],
  style: ['traditional', 'casual'],
  
  main_flowers: [],                  // Giỏ không chứa hoa
  sub_flowers: [],
  
  dominant_color: 'nâu tự nhiên',
  secondary_colors: [],
  
  layout: 'round',                   // Dạng giỏ
  elements: ['xử lý thiên nhiên', 'tay cầm chắc chắn'],
  
  images: [{
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61',
    publicId: 'basket-rattan-round-1'
  }],
  
  status: 'active',
  isHot: false,
  isNewProduct: false
};

// ============================================
// VÍ DỤ 4: GIẤY GÓI (Wrapper)
// ============================================
const wrapperExample = {
  name: 'Giấy Gói Hồng Nhạt Matte',
  description: 'Giấy gói màu hồng nhạt, bề mặt matte, dễ bọc, phù hợp các bó hoa lãng mạn',
  price: 35000,
  originalPrice: 40000,
  stock: 200,
  sold: 150,
  category: ObjectId('507f1f77bcf86cd799439013'),  // Category "Giấy Gói & Vải"
  
  product_type: 'wrapper',           // Loại: vật liệu bao bọc
  role_type: null,
  
  occasion: ['lãng mạn', 'sinh nhật'],
  style: ['romantic', 'elegant'],
  
  main_flowers: [],
  sub_flowers: [],
  
  dominant_color: 'hồng',
  secondary_colors: [],
  
  layout: null,
  elements: ['matte finish', 'dễ bọc'],
  
  images: [{
    url: 'https://images.unsplash.com/photo-1577720643272-265dc37ee3d6',
    publicId: 'paper-pink-matte-1'
  }],
  
  status: 'active',
  isHot: false,
  isNewProduct: false
};

// ============================================
// VÍ DỤ 5: RUY BĂNG (Ribbon)
// ============================================
const ribbonExample = {
  name: 'Ruy Băng Satin Trắng',
  description: 'Ruy băng satin bóng màu trắng, độ rộng 2cm, phù hợp trang trí bó hoa',
  price: 22000,
  originalPrice: 25000,
  stock: 300,
  sold: 200,
  category: ObjectId('507f1f77bcf86cd799439014'),  // Category "Ruy Băng & Nơ"
  
  product_type: 'ribbon',            // Loại: ruy băng/nơ
  role_type: null,
  
  occasion: ['lãng mạn', 'đám cưới'],
  style: ['elegant', 'classic'],
  
  main_flowers: [],
  sub_flowers: [],
  
  dominant_color: 'trắng',
  secondary_colors: [],
  
  layout: null,
  elements: ['satin ribbon', '2cm width'],
  
  images: [{
    url: 'https://images.unsplash.com/photo-1566897777294-bf6f96e88003',
    publicId: 'ribbon-satin-white-1'
  }],
  
  status: 'active',
  isHot: false,
  isNewProduct: false
};

// ============================================
// VÍ DỤ 6: PHỤ KIỆN (Accessory)
// ============================================
const accessoryExample = {
  name: 'Gấu Bông Nhỏ Trắng',
  description: 'Gấu bông nhỏ xinh xắn màu trắng, phù hợp để cắm trên bó hoa',
  price: 45000,
  originalPrice: 55000,
  stock: 150,
  sold: 100,
  category: ObjectId('507f1f77bcf86cd799439015'),  // Category "Phụ Kiện Trang Trí"
  
  product_type: 'accessory',         // Loại: phụ kiện trang trí
  role_type: null,
  
  occasion: ['sinh nhật', 'lãng mạn', 'tặng quà'],
  style: ['cute', 'casual'],
  
  main_flowers: [],
  sub_flowers: [],
  
  dominant_color: 'trắng',
  secondary_colors: [],
  
  layout: null,
  elements: ['teddy bear', 'cute decoration'],
  
  images: [{
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
    publicId: 'teddy-white-small-1'
  }],
  
  status: 'active',
  isHot: true,
  isNewProduct: true
};

// ============================================
// VÍ DỤ 7: GIỎ HOA HOÀN CHỈNH (Complete Bouquet)
// ============================================
const completeBouquetExample = {
  name: 'Giỏ Hoa Hồng Đỏ Luxury',
  description: 'Bó hoa hồng đỏ luxury với 12 bông hồng đỏ nhung Ecuador, được sắp xếp tinh tế trong giỏ mây cao cấp',
  price: 650000,
  originalPrice: 750000,
  stock: 20,
  sold: 15,
  category: ObjectId('507f1f77bcf86cd799439016'),  // Category "Giỏ Hoa Hoàn Chỉnh"
  
  product_type: 'complete_bouquet',  // Loại: giỏ hoa hoàn chỉnh
  role_type: null,
  
  occasion: ['valentine', 'kỷ niệm', 'lãng mạn'],
  style: ['luxury', 'romantic'],
  
  // Giỏ hoàn chỉnh chứa hoa chính và hoa phụ
  main_flowers: [
    'hoa hồng đỏ',
    'có thể có nhiều loại'
  ],
  sub_flowers: ['baby breath'],
  
  dominant_color: 'đỏ',              // Màu chủ đạo của bó
  secondary_colors: ['trắng', 'xanh lá'],
  
  layout: 'round',                   // Dạng bó
  elements: [
    'ruy băng vàng',
    'nơ sang trọng',
    'giỏ mây cao cấp',
    'thiệp tặng'
  ],
  
  images: [{
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7',
    publicId: 'bouquet-red-rose-luxury-1'
  }],
  
  status: 'active',
  isHot: true,
  isNewProduct: true,
  
  averageRating: 4.9,
  numReviews: 67
};

// ============================================
// BẢNG SO SÁNH CÁC LOẠI PRODUCT_TYPE
// ============================================
/*
┌──────────────────────┬────────────┬───────────┬──────────────────────┐
│ product_type         │ role_type  │ Ví dụ     │ Chú thích             │
├──────────────────────┼────────────┼───────────┼──────────────────────┤
│ flower_component     │ main_flower│ Hoa hồng  │ Hoa chính, đắt tiền  │
│ flower_component     │ sub_flower │ Baby br. │ Hoa phụ, rẻ tiền     │
│ basket               │ null       │ Giỏ mây   │ Container để chứa    │
│ wrapper              │ null       │ Giấy gói  │ Vật liệu bao bọc     │
│ ribbon               │ null       │ Ruy băng  │ Trang trí bên ngoài  │
│ accessory            │ null       │ Gấu bông  │ Phụ kiện kèm theo    │
│ complete_bouquet     │ null       │ Giỏ hoa   │ Sản phẩm cuối cùng   │
└──────────────────────┴────────────┴───────────┴──────────────────────┘
*/

// ============================================
// BẢNG SO SÁNH OCCASION
// ============================================
/*
┌─────────────────┬───────────────────────────────────────┐
│ Occasion        │ Ý Nghĩa / Dịp Tặng                   │
├─────────────────┼───────────────────────────────────────┤
│ valentine       │ Ngày Valentine (14/2)                │
│ sinh nhật       │ Sinh nhật, các sự kiện kỉ niệm tuổi  │
│ đám cưới        │ Hôn lễ, tiệc cưới                   │
│ tốt nghiệp      │ Tốt nghiệp học tập, hoàn thành      │
│ khai trương      │ Khai trương cửa hàng, công ty       │
│ chia buồn        │ Tang lễ, chia buồn, chia sẻ nỗi đau │
│ kỷ niệm         │ Kỷ niệm ngày cưới, ngày yêu nhau    │
│ lãng mạn        │ Tặng người yêu, bạn gái, vợ        │
│ trang trí        │ Trang trí không gian, sự kiện       │
│ tặng quà        │ Quà tặng chung, không dịp cụ thể    │
└─────────────────┴───────────────────────────────────────┘
*/

// ============================================
// BẢNG SO SÁNH STYLE
// ============================================
/*
┌────────────────┬────────────────────────────────────────┐
│ Style          │ Đặc Điểm / Ý Tưởng Thiết Kế          │
├────────────────┼────────────────────────────────────────┤
│ luxury         │ Cao cấp, đắt tiền, vật liệu tốt      │
│ romantic       │ Lãng mạn, tình cảm, mềm mại          │
│ elegant        │ Thanh lịch, tinh tế, sang trọng      │
│ minimalist     │ Tối giản, ít hoa, thiết kế sạch sẽ   │
│ vibrant        │ Sống động, nhiều màu, vui vẻ         │
│ casual         │ Bình dân, thân thuộc, dễ dàng        │
│ vintage        │ Cổ điển, retro, kỹ thuật lâu đời    │
│ modern         │ Hiện đại, xu hướng mới, công nghệ    │
│ professional   │ Chuyên nghiệp, kinh doanh, trang trọng│
│ premium        │ Cao cấp (tương tự luxury)            │
└────────────────┴────────────────────────────────────────┘
*/

// ============================================
// BẢNG SO SÁNH LAYOUT
// ============================================
/*
┌─────────────┬──────────────────────────────────────────┐
│ Layout      │ Hình Dáng / Cách Sắp Xếp                │
├─────────────┼──────────────────────────────────────────┤
│ round       │ Hình tròn (đầu to, phổ biến nhất)       │
│ square      │ Hình vuông, hiện đại                    │
│ oval        │ Hình bầu dục, kéo dài                  │
│ cascade     │ Tầng lạt, dạng dòng nước (cưới)         │
│ heart       │ Hình trái tim, lãng mạn                │
│ triangular  │ Hình tam giác, hiện đại                │
└─────────────┴──────────────────────────────────────────┘
*/

// ============================================
// EXPORT CÁC VÍ DỤ
// ============================================
module.exports = {
  mainFlowerExample,
  subFlowerExample,
  basketExample,
  wrapperExample,
  ribbonExample,
  accessoryExample,
  completeBouquetExample
};
