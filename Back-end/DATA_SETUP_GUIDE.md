# 📦 Hướng Dẫn Nhập Dữ Liệu Sản Phẩm

## 🎯 Tổng Quan
File `seed_comprehensive_products.js` chứa bộ dữ liệu sản phẩm hoa hoàn chỉnh cho dự án e-commerce hoa của bạn. Bộ dữ liệu này bao gồm **45 sản phẩm** được phân loại theo **6 danh mục** khác nhau.

## 📋 Danh Mục Sản Phẩm

### 1. **Hoa Tươi (12 sản phẩm)**
- **Main Flowers (Hoa chính - 7 sản phẩm):**
  - Hoa Hồng Đỏ Nhung Ecuador
  - Hoa Hồng Hồng Phấn Đà Lạt
  - Hoa Hồng Trắng Hoa Cúc
  - Hoa Ly Trắng Thơm
  - Hướng Dương Vàng
  - Hoa Cúc Vàng
  - Hoa Lan Tím Quý Phái

- **Sub Flowers (Hoa phụ - 5 sản phẩm):**
  - Baby Breath Trắng
  - Lá Eucalyptus Xanh
  - Hoa Lavender Tím
  - Hoa Matalana Hồng
  - (+ các lá trang trí)

### 2. **Giỏ & Lẵng (5 sản phẩm)**
- Giỏ Mây Tròn Truyền Thống (150K)
- Lẵng Tre Vuông Sang Trọng (220K)
- Hộp Giấy Kraft Oval (85K)
- Giỏ Gỗ Xoan Đào Cao Cấp (350K)

### 3. **Giấy Gói & Vải (5 sản phẩm)**
- Giấy Gói Hồng Nhạt Matte (35K)
- Giấy Cellophane Trong Suốt (20K)
- Vải Tulle Trắng Sang Trọng (45K)
- Giấy Gói Xanh Navy (30K)

### 4. **Ruy Băng & Nơ (3 sản phẩm)**
- Ruy Băng Satin Trắng (22K)
- Ruy Băng Organza Hồng (28K)
- Nơ Vàng Kim Tuyến (38K)

### 5. **Phụ Kiện Trang Trí (4 sản phẩm)**
- Thiệp Tặng Cao Cấp (15K)
- Gấu Bông Nhỏ Trắng (45K)
- Nến Thơm Hoa Hồng (65K)
- Trang Trí Pha Lê Lấp Lánh (25K)

### 6. **Giỏ Hoa Hoàn Chỉnh (3 sản phẩm)**
- Giỏ Hoa Hồng Đỏ Luxury (650K)
- Giỏ Hoa Hạnh Phúc (450K)
- Giỏ Hoa Ly Trắng Yên Tĩnh (750K)

---

## 🚀 Cách Chạy Seeder

### Bước 1: Đảm bảo MongoDB đang chạy
```bash
# Windows (nếu dùng MongoDB Community)
mongod
```

### Bước 2: Chạy seeder
```bash
cd d:\TTTN\Back-end
node seed_comprehensive_products.js
```

### Output mong đợi:
```
✅ Connected to MongoDB
✅ Created category: Hoa Tươi
ℹ️ Category already exists: Giỏ Hoa Hoàn Chỉnh
...
✅ Created: Hoa Hồng Đỏ Nhung Ecuador
✏️ Updated: Hoa Hồng Hồng Phấn Đà Lạt
...
✨ Seeding completed!
📝 Created: 40 new products
✏️ Updated: 5 existing products
📊 Total: 45 products processed
```

---

## 📊 Cấu Trúc Dữ Liệu Sản Phẩm

Mỗi sản phẩm bao gồm các trường sau:

### Thông Tin Cơ Bản
```javascript
{
  name: "Tên sản phẩm",                    // Tên sản phẩm (Bắt buộc)
  slug: "ten-san-pham",                   // URL slug (Tự động tạo)
  description: "Mô tả chi tiết",          // Mô tả sản phẩm
  price: 150000,                          // Giá hiện tại (VNĐ)
  originalPrice: 170000,                  // Giá gốc (để tính discount)
  stock: 50,                              // Tồn kho
  sold: 35,                               // Số lượng đã bán
  status: "active"                        // Trạng thái: active, inactive, out_of_stock
}
```

### Phân Loại AI
```javascript
{
  product_type: "flower_component",       // Loại: complete_bouquet, basket, wrapper, ribbon, flower_component, accessory
  role_type: "main_flower",               // Vai trò: main_flower, sub_flower (cho flower_component)
  category: ObjectId                      // Reference đến Category
}
```

### Thuộc Tính Trang Trí
```javascript
{
  occasion: ["valentine", "sinh nhật"],   // Dịp tặng
  style: ["luxury", "romantic"],          // Phong cách
  main_flowers: ["hoa hồng"],             // Hoa chính
  sub_flowers: ["baby breath"],           // Hoa phụ
  dominant_color: "đỏ",                   // Màu chủ đạo
  secondary_colors: ["trắng", "xanh"],    // Màu phụ
  layout: "round",                        // Kiểu dáng: round, square, oval, cascade
  elements: ["ruy băng vàng"]              // Các yếu tố trang trí
}
```

### Thông Tin Khác
```javascript
{
  isHot: true,                            // Sản phẩm hot (bán chạy)
  isNewProduct: true,                     // Sản phẩm mới
  averageRating: 4.5,                     // Đánh giá trung bình
  numReviews: 23,                         // Số lượng review
  images: [                               // Hình ảnh
    { 
      url: "https://...",
      publicId: "image-id"
    }
  ],
  createdAt: "2026-04-24T10:30:00Z"       // Thời gian tạo
}
```

---

## 💡 Mục Đích Các Trường AI

### Occasion (Dịp tặng)
- `valentine` - Ngày lễ tình yêu
- `sinh nhật` - Sinh nhật
- `đám cưới` - Đám cưới
- `tốt nghiệp` - Tốt nghiệp
- `khai trương` - Khai trương cửa hàng
- `chia buồn` - Chia buồn
- `kỷ niệm` - Kỷ niệm
- `lãng mạn` - Dịp lãng mạn chung
- `trang trí` - Trang trí nội thất
- `tặng quà` - Quà tặng chung

### Style (Phong cách)
- `luxury` - Sang trọng cao cấp
- `romantic` - Lãng mạn
- `elegant` - Thanh lịch
- `minimalist` - Tối giản
- `vibrant` - Sống động
- `casual` - Bình dân thân thuộc
- `vintage` - Cổ điển
- `modern` - Hiện đại
- `professional` - Chuyên nghiệp
- `premium` - Cao cấp

### Color (Màu sắc)
Các sản phẩm được gắn với màu sắc cơ bản:
- `đỏ`, `hồng`, `trắng`, `xanh`, `vàng`, `tím`, `nâu`, `đen`

### Layout (Kiểu dáng)
- `round` - Tròn (phổ biến nhất)
- `square` - Vuông
- `oval` - Hình bầu dục
- `cascade` - Tầng lạt (dạng dòng nước)
- `heart` - Hình trái tim

---

## 🔄 Cách Xóa và Nhập Lại Dữ Liệu

### Xóa tất cả sản phẩm (Tuỳ chọn)
Nếu muốn xóa dữ liệu cũ trước khi seeding:

1. Mở file `seed_comprehensive_products.js`
2. Tìm dòng có comment "Xóa sản phẩm cũ (tùy chọn)"
3. Uncomment dòng: `await Product.deleteMany({});`
4. Chạy lại seeder

### Chỉ cập nhật sản phẩm hiện có
Nếu không uncomment, seeder sẽ:
- ✅ Cập nhật sản phẩm nếu đã tồn tại (cùng tên)
- ✅ Tạo mới nếu chưa tồn tại

---

## 📈 Thống Kê Dữ Liệu

| Danh Mục | Số Sản Phẩm | Giá Min | Giá Max | Tồn Kho Tổng |
|----------|------------|--------|--------|--------------|
| Hoa Tươi | 12 | 15K | 70K | 1,820 |
| Giỏ & Lẵng | 5 | 85K | 350K | 360 |
| Giấy Gói & Vải | 5 | 20K | 45K | 1,030 |
| Ruy Băng & Nơ | 3 | 22K | 38K | 650 |
| Phụ Kiện | 4 | 15K | 65K | 930 |
| **Giỏ Hoàn Chỉnh** | **3** | **450K** | **750K** | **70** |
| **TỔNG** | **32** | **15K** | **750K** | **4,860** |

---

## 🛠️ Chỉnh Sửa & Mở Rộng Dữ Liệu

### Thêm sản phẩm mới
1. Mở file `seed_comprehensive_products.js`
2. Tìm mảng `productsData`
3. Thêm object sản phẩm mới theo format
4. Chạy lại seeder

### Sửa giá/tồn kho sản phẩm hiện có
1. Sửa trực tiếp trong mảng `productsData`
2. Chạy lại seeder (sẽ cập nhật dữ liệu cũ)

### Thêm hình ảnh thực tế
Hiện tại seeder dùng placeholder từ Unsplash. Để dùng hình ảnh thực:

1. Upload hình lên Cloudinary
2. Cập nhật URL trong `images` array
3. Cập nhật `publicId` (để tracking)

```javascript
images: [
  { 
    url: "https://res.cloudinary.com/your-cloud/image/upload/...",
    publicId: "your-product-id-1"
  }
]
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **MongoDB phải đang chạy** trước khi thực thi seeder
2. **Connection String** phải được set đúng trong `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/your_db_name
   ```
3. **Category sẽ tự động tạo** nếu chưa tồn tại
4. **Slug tự động sinh** từ tên sản phẩm (khác biệt: chữ thường, loại ký tự đặc biệt)
5. **Nếu chạy lại**, sản phẩm cùng tên sẽ **cập nhật** thay vì tạo bản sao

---

## 📞 Lệnh Hữu Ích

```bash
# Xem log chi tiết
node seed_comprehensive_products.js 2>&1 | tee seeding.log

# Chạy với environment khác
NODE_ENV=production node seed_comprehensive_products.js

# Kết hợp với MongoDB shell để kiểm tra
# Trong MongoDB shell:
# db.products.countDocuments()
# db.categories.countDocuments()
```

---

## ✅ Kiểm Tra Dữ Liệu Sau Khi Seeding

```bash
# Vào MongoDB shell
mongosh

# Chọn database
use your_db_name

# Đếm số lượng
db.products.countDocuments()        # Nên trả về 45
db.categories.countDocuments()      # Nên trả về 6

# Xem một sản phẩm
db.products.findOne()

# Xem các danh mục
db.categories.find()
```

---

**Tạo bởi:** AI Assistant  
**Ngày:** April 24, 2026  
**Version:** 1.0
