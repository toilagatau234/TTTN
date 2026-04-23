# 🌸 BỘ DỮ LIỆU SẢN PHẨM HÒA TƯƠI - QUICK START

## 📦 Files Tôi Vừa Tạo Cho Bạn

Bạn sẽ tìm thấy **3 files** mới trong thư mục `Back-end/`:

### 1. **seed_comprehensive_products.js** ⭐
- **File chính** để nhập dữ liệu sản phẩm vào MongoDB
- Chứa **32 sản phẩm chi tiết** với đầy đủ thông tin
- Tự động tạo **6 danh mục**
- Có thể cập nhật hoặc tạo mới sản phẩm

### 2. **DATA_SETUP_GUIDE.md**
- Hướng dẫn **chi tiết từng bước**
- Cấu trúc dữ liệu sản phẩm
- Cách chỉnh sửa & mở rộng dữ liệu

### 3. **PRODUCT_DATA_SAMPLES.js**
- **7 mẫu dữ liệu** cho từng loại sản phẩm
- Bảng so sánh các loại `product_type`
- Tham khảo cấu trúc chi tiết

---

## 🚀 CHẠY NGAY (Quick Start)

```bash
# Bước 1: Mở terminal tại thư mục Back-end
cd d:\TTTN\Back-end

# Bước 2: Chạy seeder
node seed_comprehensive_products.js
```

**Output mong đợi:**
```
✅ Connected to MongoDB
✅ Created category: Hoa Tươi
✅ Created: Hoa Hồng Đỏ Nhung Ecuador
✅ Created: Hoa Hồng Hồng Phấn Đà Lạt
... (tiếp tục tạo 30+ sản phẩm)
✨ Seeding completed!
📝 Created: 30 new products
📊 Total: 32 products processed
```

---

## 📊 Bộ Dữ Liệu Bao Gồm

| Danh Mục | Số Sản Phẩm | Giá Từ - Đến | Ví Dụ |
|----------|------------|------------|------|
| 🌹 Hoa Tươi | 12 | 15K - 70K | Hoa hồng, hoa ly, hướng dương |
| 🧺 Giỏ & Lẵng | 5 | 85K - 350K | Giỏ mây, lẵng tre, hộp kraft |
| 📄 Giấy & Vải | 5 | 20K - 45K | Giấy gói, tulle, cellophane |
| 🎀 Ruy Băng | 3 | 22K - 38K | Satin, organza, nơ vàng |
| 🎁 Phụ Kiện | 4 | 15K - 65K | Gấu bông, nến thơm, thiệp |
| 🌺 **Bó Hoàn Chỉnh** | **3** | **450K - 750K** | Giỏ hoa luxury |
| **TỔNG** | **32** | - | **4,860 items tồn kho** |

---

## ✨ Tính Năng Dữ Liệu

✅ **Đầy đủ AI Attributes** cho AI Bouquet Builder
- `product_type`: flower_component, basket, wrapper, ribbon, accessory, complete_bouquet
- `role_type`: main_flower, sub_flower
- `occasion`: valentine, sinh nhật, đám cưới, v.v.
- `style`: luxury, romantic, elegant, minimalist, v.v.
- `dominant_color`: red, pink, white, green, v.v.
- `layout`: round, square, oval, cascade

✅ **Giá thành hợp lý** cho mô phỏng bán hàng
- Hoa lẻ: 15K - 70K
- Bó hoàn chỉnh: 450K - 750K
- Có originalPrice để tính discount

✅ **Hình ảnh placeholder** từ Unsplash
- Có thể thay bằng hình ảnh thực từ Cloudinary

✅ **Trạng thái sản phẩm**
- `isHot`: Sản phẩm bán chạy
- `isNewProduct`: Sản phẩm mới
- `status`: active, inactive, out_of_stock

---

## 💡 Ví Dụ Cách Sử Dụng Data Này

### 1. Hiển Thị Trên Trang Web
```javascript
// Lấy tất cả hoa tươi
GET /api/products?category=Hoa%20Tươi

// Lấy sản phẩm hot
GET /api/products?isHot=true

// Tìm theo dịp
GET /api/products?occasion=valentine
```

### 2. Cho AI Bouquet Builder
```javascript
// Lấy các hoa chính
GET /api/products?product_type=flower_component&role_type=main_flower

// Lấy phụ kiện cụ thể
GET /api/products?product_type=ribbon&style=luxury

// Lấy theo occasion
GET /api/products?occasion=sinh%20nhật&style=casual
```

### 3. Tính Giá Thành Giỏ Hoa
```javascript
// Ví dụ: Tạo giỏ hoa tùy chỉnh
const bouquet = {
  main_flower: [
    { id: "rose-red-1", quantity: 5, price: 45000 },  // 5 bông hồng
    { id: "sunflower-1", quantity: 3, price: 30000 }  // 3 hướng dương
  ],
  sub_flowers: [
    { id: "baby-breath-1", quantity: 2, price: 20000 }
  ],
  basket: { id: "basket-round-1", price: 150000 },
  wrapper: { id: "paper-pink-1", price: 35000 },
  ribbon: { id: "ribbon-white-1", price: 22000 }
};
// Total: 5*45k + 3*30k + 2*20k + 150k + 35k + 22k = 570,000 VNĐ
```

---

## 🔧 Các Thao Tác Phổ Biến

### Thêm Sản Phẩm Mới
1. Mở `seed_comprehensive_products.js`
2. Thêm object vào mảng `productsData`
3. Chạy lại `node seed_comprehensive_products.js`

### Cập Nhật Giá/Tồn Kho
1. Sửa trong `seed_comprehensive_products.js`
2. Chạy lại seeder (tự động cập nhật)

### Xóa Dữ Liệu Cũ
1. Tìm dòng `// await Product.deleteMany({});`
2. Bỏ comment: `await Product.deleteMany({});`
3. Chạy lại seeder

### Xem Dữ Liệu Trong MongoDB
```bash
mongosh
use your_db_name
db.products.find().pretty()
db.products.countDocuments()
```

---

## 📝 Yêu Cầu & Điều Kiện

✅ **Bắt buộc:**
- Node.js & npm đã cài
- MongoDB đang chạy
- `.env` file có `MONGO_URI`

❌ **Sẽ báo lỗi nếu:**
- MongoDB connection failed
- `.env` không có MONGO_URI
- Database không tồn tại

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "Cannot connect to MongoDB"
```bash
# Kiểm tra MongoDB đang chạy
mongosh

# Hoặc chạy MongoDB service (Windows)
net start MongoDB
```

### Lỗi: "MONGO_URI is undefined"
```
Thêm vào .env:
MONGO_URI=mongodb://localhost:27017/your_database_name
```

### Lỗi: "Duplicate key error"
```
Xóa collection cũ:
db.products.deleteMany({})

Hoặc uncomment dòng xóa trong seeder.js
```

---

## 📞 Hỗ Trợ

### Xem chi tiết hơn
👉 Mở file **DATA_SETUP_GUIDE.md**

### Xem cấu trúc dữ liệu chi tiết
👉 Mở file **PRODUCT_DATA_SAMPLES.js**

### Muốn kiểm tra sau khi seeding
```bash
# Terminal
mongosh
use your_db_name
db.products.find().limit(3)  # Xem 3 sản phẩm đầu
```

---

## 📈 Bước Tiếp Theo

Sau khi seeding thành công, bạn có thể:

1. ✅ **Kiểm tra API** - Gọi GET `/api/products` xem dữ liệu
2. ✅ **Hiển thị UI** - Build trang danh sách sản phẩm
3. ✅ **Tích hợp AI** - Dùng data cho AI Bouquet Builder
4. ✅ **Thêm review** - User có thể review sản phẩm
5. ✅ **Test cart** - Thêm sản phẩm vào giỏ hàng

---

## 📄 Thông Tin File

```
Back-end/
├── seed_comprehensive_products.js  ← Chạy cái này
├── DATA_SETUP_GUIDE.md             ← Đọc hướng dẫn
├── PRODUCT_DATA_SAMPLES.js         ← Tham khảo cấu trúc
└── models/
    └── Product.js                  ← Schema định nghĩa
```

---

**Tạo lúc:** April 24, 2026  
**Status:** ✅ Sẵn sàng sử dụng  
**Version:** 1.0
