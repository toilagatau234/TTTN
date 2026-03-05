/**
 * @file hydrangeaController.js
 * @description Controller cho Assistant Hydrangea (Tạo giỏ hoa theo luồng multi-turn).
 * Chức năng cốt lõi: Tiếp nhận Request từ frontend, trích xuất user/session ID và truyền cho Service.
 */

const hydrangeaService = require('../services/hydrangea.service');

const hydrangeaController = {

  /**
   * Truy cập: POST /api/v1/ai/hydrangea/chat
   */
  async processChat(req, res) {
    try {
      const { message, isConfirming } = req.body;
      // Trong thực tế, sessionId thường lấy từ req.user.id (JWT) hoặc thiết lập riêng từ client
      // Tạm thời mockup một user cố định nếu như frontend chưa truyền lên
      const sessionId = req.body.sessionId || req.user?.id || 'anonymous_hydrangea_user';

      if (!message && !isConfirming) {
        return res.status(400).json({ success: false, error: 'Dữ liệu đầu vào không hợp lệ.' });
      }

      const result = await hydrangeaService.processChatMessage(sessionId, message, isConfirming);

      return res.status(200).json({
        success: true,
        reply: result.botReply,
        image: result.imageUrl,
        extractedEntities: result.entities
      });

    } catch (error) {
      console.error('[Hydrangea Controller Error]:', error.message);
      return res.status(500).json({
        success: false,
        reply: "Hệ thống mệt mỏi chút xíu, xin lỗi bạn. Vui lòng thử lại sau vài giây nhé."
      });
    }
  }
};

module.exports = hydrangeaController;