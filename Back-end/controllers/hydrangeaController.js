/**
 * @file hydrangeaController.js
 * @description Controller đóng vai trò Orchestrator (Nhạc trưởng) trong kiến trúc Microservices.
 * * [HỌC THUẬT - ĐƯA VÀO BÁO CÁO]:
 * - Pattern sử dụng: API Gateway / Orchestrator Pattern.
 * - Luồng xử lý (Data Flow):
 * 1. Nhận Raw Text từ Client.
 * 2. Forward tới Python Microservice (Port 8000) để thực hiện NLP (Intent Classification & NER) bằng mô hình PhoBERT nội bộ.
 * 3. Dựa trên JSON nhận về (Intent, Entities), thực hiện truy vấn cơ sở dữ liệu (MongoDB) theo cơ chế RAG (Retrieval-Augmented Generation) tĩnh.
 * 4. Sinh câu trả lời dựa trên Rule-based Templates (Zero Hallucination).
 * 5. Nếu cờ `isConfirming` = true, Orchestrator đóng gói Prompt và gửi tới Gemini API để sinh ảnh giỏ hoa, sau đó trả URL về cho Client.
 */

const axios = require('axios');
const { Mongoose } = require('mongoose');
const Product = require('../models/Product'); // Giả định bạn có model Product
// Import cấu hình Gemini SDK (Bạn cần cài đặt @google/genai hoặc sử dụng fetch API tương đương)
const { GoogleGenerativeAI } = require('@google/genai'); 

// Cấu hình kết nối tới Python Microservice
const PYTHON_NLP_SERVICE_URL = process.env.PYTHON_NLP_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Khởi tạo Gemini Client (Chỉ dùng cho Text-to-Image / Imagen model)
const ai = new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY });

const hydrangeaController = {
  
  /**
   * Endpoint chính xử lý mọi giao tiếp với Hydrangea
   * Route: POST /api/v1/hydrangea/chat
   */
  async processChat(req, res) {
    try {
      const { message, isConfirming, currentContext } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
      }

      // --------------------------------------------------------------------------------
      // PHASE 1: NLP EXTRACTION (GỌI PYTHON MICROSERVICE)
      // --------------------------------------------------------------------------------
      // Gửi raw text tới FastAPI để bóc tách ý định và thực thể
      const nlpResponse = await axios.post(`${PYTHON_NLP_SERVICE_URL}/api/analyze`, {
        text: message
      });

      const { intent, entities } = nlpResponse.data; 
      // Mong đợi Python trả về dạng: 
      // { intent: "create_custom_basket", entities: { color: "đỏ", flower: "hồng", budget: 500000 } }

      let replyText = "";
      let imageUrl = null;

      // --------------------------------------------------------------------------------
      // PHASE 2: ORCHESTRATION & BUSINESS LOGIC (ZERO HALLUCINATION TEXT GENERATION)
      // --------------------------------------------------------------------------------
      switch (intent) {
        case 'create_custom_basket': // Role A - Đang trong luồng tạo giỏ hoa
          
          if (isConfirming) {
            // [PHASE 3A]: NGƯỜI DÙNG ĐÃ CHỐT -> GỌI GEMINI SINH ẢNH
            const prompt = hydrangeaController._buildGeminiPrompt(currentContext, entities);
            imageUrl = await hydrangeaController._generateImageWithGemini(prompt);
            replyText = "Hydrangea đã phác thảo xong giỏ hoa độc bản của bạn. Bạn xem có ưng ý không nhé!";
          } else {
            // [PHASE 3B]: ĐANG LẤY THÔNG TIN -> TRUY VẤN KHO (RAG)
            const availableFlowers = await hydrangeaController._queryInventory(entities);
            replyText = hydrangeaController._buildDynamicTemplate(entities, availableFlowers);
            // Kích hoạt cờ yêu cầu UI hiển thị nút "Xác nhận thiết kế này"
          }
          break;

        case 'policy_inquiry': // Role B - Chatbot hỗ trợ chung
          // Hardcode/Template based để tránh ảo giác
          replyText = "Dạ, Rosee giao hàng miễn phí trong bán kính 5km nội thành Cao Lãnh. Bạn có cần hỗ trợ thêm thông tin gì không ạ?";
          break;

        case 'greeting':
          replyText = "Xin chào! Mình là Hydrangea, trợ lý ảo của Rosee. Mình có thể giúp bạn tạo một giỏ hoa thiết kế riêng hoặc giải đáp các thắc mắc về cửa hàng nhé!";
          break;

        default: // Fallback
          replyText = "Dạ Hydrangea chưa hiểu ý bạn lắm. Bạn có thể nói rõ hơn về loại hoa hoặc màu sắc bạn thích không ạ?";
      }

      // --------------------------------------------------------------------------------
      // PHASE 4: RESPONSE TO CLIENT
      // --------------------------------------------------------------------------------
      return res.status(200).json({
        success: true,
        reply: replyText,
        image: imageUrl,
        extractedEntities: entities,
        intentMatched: intent
      });

    } catch (error) {
      console.error('[Hydrangea Orchestrator Error]:', error.message);
      return res.status(500).json({ 
        success: false, 
        reply: "Hệ thống đang bảo trì một chút, bạn vui lòng thử lại sau nhé." 
      });
    }
  },

  // ================= CÁC HÀM HELPER NỘI BỘ (PRIVATE METHODS) =================

  /**
   * Truy vấn CSDL MongoDB để kiểm tra hoa có sẵn (Emulate RAG retrieval)
   */
  async _queryInventory(entities) {
    // Xây dựng query động dựa trên entities trích xuất từ PhoBERT
    const query = { status: 'available' };
    if (entities.flower) query.name = { $regex: new RegExp(entities.flower, 'i') };
    if (entities.color) query.color = entities.color;
    
    // Giới hạn trả về 3 loại hoa phù hợp nhất
    const products = await Product.find(query).limit(3).lean();
    return products;
  },

  /**
   * Sinh text nội bộ (Template-based Generation)
   */
  _buildDynamicTemplate(entities, availableFlowers) {
    if (availableFlowers.length === 0) {
      return `Hiện tại kho Rosee đang tạm hết loại hoa ${entities.flower || ''} màu ${entities.color || ''}. Bạn có muốn đổi sang tông màu khác không ạ?`;
    }

    const flowerNames = availableFlowers.map(f => f.name).join(", ");
    return `Tuyệt vời! Với ngân sách và sở thích của bạn, Rosee hiện có sẵn các loại: ${flowerNames}. Bạn có muốn Hydrangea lên bản vẽ mẫu cho giỏ hoa này không? (Nhấn xác nhận nhé)`;
  },

  /**
   * Đóng gói Prompt Tiếng Anh (hoặc Tiếng Việt) cho Gemini API
   */
  _buildGeminiPrompt(context, entities) {
    // Kỹ thuật Prompt Engineering để tối ưu hóa hình ảnh đầu ra
    return `A high-quality, ultra-realistic studio photography of a beautiful custom flower basket. 
            Main colors: ${entities.color || 'pastel'}. 
            Main flowers: ${entities.flower || 'mixed fresh flowers'}. 
            Style: elegant, premium florist arrangement, soft natural lighting, clean background.`;
  },

  /**
   * Gọi Gemini API để sinh ảnh
   */
  async _generateImageWithGemini(prompt) {
    try {
      // Lưu ý: Hiện tại Google Gemini hỗ trợ Imagen 3. Cú pháp có thể thay đổi tùy SDK bạn đang dùng.
      // Dưới đây là logic giả mã cho luồng gọi API Image Generation của Google.
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001', // Thay đổi tên model đúng với tài liệu Google API mới nhất
        prompt: prompt,
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      });
      
      // Giả định response trả về base64, bạn có thể upload lên Cloudinary (bạn đã có thư viện này trong package.json)
      // hoặc trả trực tiếp base64 cho frontend.
      const base64Image = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64Image}`;
      
    } catch (error) {
      console.error('[Gemini API Error]:', error);
      throw new Error("Không thể sinh ảnh từ Gemini.");
    }
  }
};

module.exports = hydrangeaController;