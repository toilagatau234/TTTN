# 🌸 Rosee Floral - AI-Powered Bouquet Customization & E-commerce System

## 📌 Tổng Quan Dự Án
**Rosee Floral** là một hệ thống thương mại điện tử chuyên về hoa tươi, tích hợp trí tuệ nhân tạo (AI) để hỗ trợ khách hàng thiết kế và cá nhân hóa bó hoa theo ý muốn. Dự án được phát triển như một phần của Đồ án Tốt nghiệp (TTTN), kết hợp các công nghệ hiện đại từ Web, Mobile đến NLP (Natural Language Processing).

---

## 👥 Nhóm Thực Hiện: Nhóm 66
Dự án được thực hiện bởi các thành viên:

1. **Nguyễn Quốc Anh** - 2231540324 (Trưởng nhóm)
2. **Trần Phương Uyên** - 2254810275
3. **Bùi Khành Minh** - 2254810279

---

## 🏗️ Cấu Trúc Hệ Thống
Hệ thống bao gồm 4 thành phần chính:

### 1. 🖥️ Front-end (Web)
- **Công nghệ:** React.js, Vite, Tailwind CSS.
- **Tính năng:** Giao diện khách hàng (mua sắm, giỏ hàng, thanh toán) và Dashboard cho Admin quản lý sản phẩm, đơn hàng.

### 2. 📱 Mobile App
- **Công nghệ:** Flutter.
- **Tính năng:** Trải nghiệm mua sắm mượt mà trên thiết bị di động, tích hợp chat với AI Assistant.

### 3. ⚙️ Back-end (API Server)
- **Công nghệ:** Node.js, Express, MongoDB (Mongoose).
- **Tính năng:** Quản lý dữ liệu, xác thực người dùng, xử lý đơn hàng và tích hợp dịch vụ AI.

### 4. 🧠 Rosee AI Service
- **Công nghệ:** Python, FastAPI, PhoBERT, Transformers.
- **Tính năng:** 
  - Phân loại ý định (Intent Classification) và trích xuất thực thể (NER) tiếng Việt.
  - Tư vấn sản phẩm hoa dựa trên sở thích và dịp (Valentine, Sinh nhật, v.v.).
  - Demo tạo ảnh hoa bằng AI (Hybrid Pollinations AI).

---

## ✨ Tính Năng Nổi Bật
- **AI Bouquet Builder:** Chatbot thông minh hiểu ngôn ngữ tự nhiên của khách hàng để gợi ý các thành phần (loại hoa, giấy gói, phụ kiện) phù hợp.
- **Smart Product Search:** Tìm kiếm và lọc sản phẩm theo các thuộc tính AI (Occasion, Style, Color, Layout).
- **Admin Management:** Hệ thống quản lý toàn diện cho chủ cửa hàng.
- **Responsive Design:** Hoạt động tốt trên mọi thiết bị.

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js (v18+)
- Python (3.9+)
- Flutter SDK
- MongoDB (Local hoặc Atlas)

### 1. Cài đặt Back-end
```bash
cd Back-end
npm install
# Cấu hình .env (MONGO_URI, JWT_SECRET, v.v.)
npm start
```

### 2. Cài đặt Front-end
```bash
cd Front-end
npm install
npm run dev
```

### 3. Cài đặt AI Service
```bash
cd rosee-ai-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

### 4. Cài đặt Mobile App
```bash
cd mobile_app
flutter pub get
flutter run
```

---

## 🛠️ Công Nghệ Sử Dụng
- **Database:** MongoDB
- **Backend:** Node.js, Express, FastAPI
- **Frontend:** React, Tailwind CSS, Flutter
- **AI/ML:** PhoBERT, PyTorch, HuggingFace
- **Deployment:** Docker (Optional), Vercel/Netlify (Frontend)

---

