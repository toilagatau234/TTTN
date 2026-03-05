/**
 * @fileoverview Session Service cho Hydrangea AI Chatbot.
 *
 * Quản lý vòng đời session hội thoại của người dùng bằng in-memory Map.
 * Mỗi session lưu trữ trạng thái hiện tại, các entities đã thu thập,
 * lịch sử hội thoại và timestamp cập nhật cuối cùng.
 *
 * @note Đây là giải pháp tạm thời dùng JavaScript Map.
 * Trong production, nên thay thế bằng Redis để hỗ trợ multi-instance
 * và tự động hết hạn session (TTL).
 */

const { DEFAULT_STATE } = require('../constants/dialogStates');

// -------------------------------------------------------------------
// In-memory storage — Key: userId (string), Value: session object
// -------------------------------------------------------------------
const sessionStore = new Map();

// -------------------------------------------------------------------
// Helpers (private)
// -------------------------------------------------------------------

/**
 * Kiểm tra tính hợp lệ của userId.
 * @param {*} userId - Giá trị cần kiểm tra.
 * @throws {Error} Nếu userId không hợp lệ.
 */
function _validateUserId(userId) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error(`[SessionService] userId không hợp lệ: "${userId}". Phải là chuỗi không rỗng.`);
    }
}

/**
 * Tạo một session object mặc định.
 * @returns {{ state: string, entities: object, history: Array, lastUpdated: number }}
 */
function _createDefaultSession() {
    return {
        state: DEFAULT_STATE,   // Trạng thái hội thoại hiện tại
        entities: {},           // Các thông tin đã thu thập (loại hoa, màu, v.v.)
        history: [],            // Mảng các lượt trao đổi { role, content, timestamp }
        lastUpdated: Date.now(),
    };
}

// -------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------

/**
 * Lấy session hiện tại của người dùng.
 * Nếu chưa tồn tại, tự động khởi tạo session mới với giá trị mặc định.
 *
 * @param {string} userId - Định danh duy nhất của người dùng / session.
 * @returns {{ state: string, entities: object, history: Array, lastUpdated: number }}
 * @throws {Error} Nếu userId không hợp lệ.
 */
function getSession(userId) {
    _validateUserId(userId);

    if (!sessionStore.has(userId)) {
        const newSession = _createDefaultSession();
        sessionStore.set(userId, newSession);
        console.log(`[SessionService] Tạo session mới cho user: "${userId}"`);
    }

    return sessionStore.get(userId);
}

/**
 * Cập nhật session của người dùng với các trường được chỉ định.
 * Chỉ ghi đè các trường được truyền vào; các trường còn lại được giữ nguyên.
 * Tự động cập nhật `lastUpdated`.
 *
 * @param {string} userId - Định danh duy nhất của người dùng / session.
 * @param {object} updates - Object chứa các trường cần cập nhật.
 * @param {string}   [updates.state]    - Trạng thái hội thoại mới.
 * @param {object}   [updates.entities] - Object entities mới (sẽ merge với entities hiện tại).
 * @param {Array}    [updates.history]  - Mảng history mới (ghi đè hoàn toàn).
 * @returns {{ state: string, entities: object, history: Array, lastUpdated: number }}
 *   Session sau khi cập nhật.
 * @throws {Error} Nếu userId không hợp lệ hoặc `updates` không phải là object.
 */
function updateSession(userId, updates) {
    _validateUserId(userId);

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        throw new Error('[SessionService] `updates` phải là một object hợp lệ.');
    }

    // Lấy session hiện tại (sẽ tạo mới nếu chưa có)
    const currentSession = getSession(userId);

    const updatedSession = {
        ...currentSession,
        // Merge entities thay vì ghi đè hoàn toàn
        entities: updates.entities
            ? { ...currentSession.entities, ...updates.entities }
            : currentSession.entities,
        // Các trường khác ghi đè trực tiếp nếu được cung cấp
        state: updates.state !== undefined ? updates.state : currentSession.state,
        history: updates.history !== undefined ? updates.history : currentSession.history,
        lastUpdated: Date.now(),
    };

    sessionStore.set(userId, updatedSession);
    return updatedSession;
}

/**
 * Xóa session của người dùng khỏi bộ nhớ.
 * Thường được gọi khi người dùng kết thúc hội thoại hoặc session hết hạn.
 *
 * @param {string} userId - Định danh duy nhất của người dùng / session.
 * @returns {boolean} `true` nếu session tồn tại và đã bị xóa, `false` nếu không tìm thấy.
 * @throws {Error} Nếu userId không hợp lệ.
 */
function clearSession(userId) {
    _validateUserId(userId);

    const existed = sessionStore.delete(userId);
    if (existed) {
        console.log(`[SessionService] Đã xóa session của user: "${userId}"`);
    } else {
        console.warn(`[SessionService] Không tìm thấy session của user: "${userId}" để xóa.`);
    }

    return existed;
}

// -------------------------------------------------------------------
// Dev / Debug utilities (chỉ dùng trong môi trường development)
// -------------------------------------------------------------------

/**
 * Trả về số lượng session đang hoạt động trong store.
 * @returns {number}
 */
function getActiveSessionCount() {
    return sessionStore.size;
}

module.exports = {
    getSession,
    updateSession,
    clearSession,
    getActiveSessionCount,
};
