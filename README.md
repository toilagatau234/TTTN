# 🌸 Rosee Floral - AI-Powered Bouquet Customization & E-commerce System

## 📌 Tổng Quan Dự Án
**Rosee Floral** là một hệ thống thương mại điện tử chuyên về hoa tươi, tích hợp trí tuệ nhân tạo (AI) để hỗ trợ khách hàng thiết kế và cá nhân hóa bó hoa theo ý muốn thông qua giao diện chat trực quan. Dự án tập trung vào việc mang lại trải nghiệm cá nhân hóa cao nhất cho người dùng bằng cách kết hợp sức mạnh của NLP và Generative AI.

---

## 👥 Nhóm Thực Hiện: Nhóm 66
Dự án được thực hiện bởi các thành viên:

1. **Nguyễn Quốc Anh** - 2231540324 (Trưởng nhóm)
2. **Trần Phương Uyên** - 2254810275
3. **Bùi Khành Minh** - 2254810279

---

## 🏗️ Cấu Trúc Hệ Thống
Hệ thống hiện tại tập trung vào nền tảng Web với 3 thành phần cốt lõi:

### 1. 🖥️ Front-end (Web)
- **Công nghệ:** React.js, Vite, Tailwind CSS, Lucide Icons.
- **Tính năng:** 
  - **Hydrangea Studio**: Giao diện thiết kế hoa tương tác với AI.
  - E-commerce flow: Xem sản phẩm, giỏ hàng, đặt hàng.
  - Dashboard quản trị toàn diện.

### 2. ⚙️ Back-end (API Server)
- **Công nghệ:** Node.js, Express, MongoDB (Mongoose).
- **Tính năng:** 
  - Quản lý kho sản phẩm đa dạng (Hoa chính, hoa phụ, giấy gói, ruy băng, phụ kiện).
  - Xử lý logic phiên chat (Session management) và đồng bộ dữ liệu AI.
  - Tích hợp Gemini 2.5 Flash để tối ưu hóa gợi ý và tạo prompt hình ảnh.

### 3. 🧠 Rosee AI Service (Python Microservice)
- **Công nghệ:** Python, FastAPI, PhoBERT, Transformers.
- **Tính năng:** 
  - Trích xuất thực thể (NER) và nhận diện ý định (Intent) thuần tiếng Việt.
  - Xử lý ngôn ngữ tự nhiên để hiểu sâu yêu cầu về màu sắc, loại hoa, dịp lễ.
  - Tích hợp Pollinations AI để sinh ảnh giỏ hoa thực tế từ các thành phần đã chọn.

---

## ✨ Tính Năng Nổi Bật
- **AI Hydrangea Studio:** Chatbot thông minh giúp bạn "lắp ghép" giỏ hoa trong mơ. AI hiểu được cả những yêu cầu chi tiết như "thêm nơ đỏ", "bỏ gấu bông" hay "giấy gói đen".
- **Visual Preview:** Hình ảnh giỏ hoa được sinh ra ngay lập tức sau khi bạn chọn đủ thành phần, giúp bạn hình dung sản phẩm thực tế.
- **Smart Inventory Matching:** Tự động đối soát kho hàng thực tế để chỉ gợi ý những loại hoa đang còn sẵn tại tiệm.
- **Strict Entity Matching:** Hệ thống chấm điểm (Scoring logic) ưu tiên độ chính xác về màu sắc và loài hoa theo đúng yêu cầu người dùng.

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js (v18+)
- Python (3.10+)
- MongoDB (Local hoặc Atlas)

### 1. Cấu hình & Chạy Back-end
```bash
cd Back-end
npm install
# Tạo file .env dựa trên các biến: MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```

### 2. Cấu hình & Chạy Front-end
```bash
cd Front-end
npm install
npm run dev
```

### 3. Cấu hình & Chạy AI Service (FastAPI)
```bash
cd rosee-ai-service
# Cài đặt các thư viện cần thiết (Numpy, Transformers, Scikit-learn, v.v.)
pip install -r requirements.txt
python -m app.main
```

---

## 🛠️ Công Nghệ Sử Dụng
- **Database:** MongoDB (Atlas)
- **Backend:** Node.js, FastAPI
- **Frontend:** React (Vite)
- **AI Models:** PhoBERT (NER/Intent), Gemini 2.5 Flash (Reasoning), Pollinations AI (Image Gen)
- **Styling:** CSS Modern & Tailwind CSS
