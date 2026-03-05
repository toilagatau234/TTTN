/**
 * @fileoverview Định nghĩa các hằng số trạng thái hội thoại (Dialog States)
 * cho Hydrangea AI Chatbot.
 *
 * Mỗi hằng số đại diện cho một trạng thái trong vòng đời hội thoại,
 * điều phối luồng xử lý của Dialog Manager.
 */

/**
 * @constant {string} GREETING
 * Trạng thái mặc định khi bắt đầu một phiên hội thoại mới.
 * Bot sẽ chào hỏi và hỏi nhu cầu của người dùng.
 */
const GREETING = 'GREETING';

/**
 * @constant {string} GATHERING_REQS
 * Bot đang thu thập các yêu cầu (entities) từ người dùng,
 * ví dụ: loại hoa, màu sắc, ngân sách, dịp tặng hoa, v.v.
 */
const GATHERING_REQS = 'GATHERING_REQS';

/**
 * @constant {string} CONFIRMING
 * Bot đã thu thập đủ thông tin và đang xác nhận lại với người dùng
 * trước khi thực hiện bước tiếp theo (tạo ảnh / đặt hàng).
 */
const CONFIRMING = 'CONFIRMING';

/**
 * @constant {string} GENERATING_IMAGE
 * Bot đang trong quá trình tạo ảnh hoa theo yêu cầu.
 * Trạng thái này giúp tránh xử lý những tin nhắn trùng lặp trong lúc chờ.
 */
const GENERATING_IMAGE = 'GENERATING_IMAGE';

/**
 * @constant {string} GENERAL_SUPPORT
 * Người dùng đang hỏi các câu hỏi chung không liên quan đến luồng đặt hoa,
 * ví dụ: chính sách giao hàng, câu hỏi về cửa hàng, v.v.
 */
const GENERAL_SUPPORT = 'GENERAL_SUPPORT';

/**
 * @constant {string} DEFAULT_STATE
 * Trạng thái khởi tạo mặc định cho mọi session mới.
 */
const DEFAULT_STATE = GREETING;

module.exports = {
    GREETING,
    GATHERING_REQS,
    CONFIRMING,
    GENERATING_IMAGE,
    GENERAL_SUPPORT,
    DEFAULT_STATE,
};
