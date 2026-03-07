module.exports = {
  GREETING: 'GREETING',           // Chào hỏi ban đầu
  COLLECTING: 'COLLECTING',       // Đang thu thập NER (Thiếu thông tin nào hỏi thông tin đó)
  CONFIRMING: 'CONFIRMING',       // Đã đủ thông tin, chốt lại với user
  GENERATING: 'GENERATING',       // Đang gọi Gemini sinh ảnh (Show loading UI)
  CART_MAPPING: 'CART_MAPPING'    // Đã chốt ảnh, map với DB thực tế (RAG)
};