// Test script cho Backend AI sử dụng Axios
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/ai'; // Cân chỉnh lại theo đúng port của project thực tế

async function testIris() {
    console.log("================= TEST IRIS (CSKH) =================");
    try {
        const res = await axios.post(`${BASE_URL}/iris/chat`, {
            message: "hi shop"
        });
        console.log("Iris Response (Greeting):", res.data);

        const res2 = await axios.post(`${BASE_URL}/iris/chat`, {
            message: "hoa hồng giá bao nhiêu vậy"
        });
        console.log("Iris Response (Ask Price):", res2.data);
    } catch (err) {
        console.error("Iris Error:", err.message);
    }
}

async function testHydrangea() {
    console.log("\n================= TEST HYDRANGEA (Thiết kế giỏ hoa) =================");
    try {
        // Lượt 1: Hỏi mông lung (Thiếu Entity)
        const res1 = await axios.post(`${BASE_URL}/hydrangea/chat`, {
            sessionId: "test_user_123",
            message: "mình muốn mua 1 lẵng hoa tặng mẹ"
        });
        console.log("Hydrangea Turn 1:", res1.data);

        // Lượt 2: Cung cấp màu sắc (Đủ 1 Entity cốt lõi để query RAG)
        const res2 = await axios.post(`${BASE_URL}/hydrangea/chat`, {
            sessionId: "test_user_123",
            message: "lẵng hoa màu vàng sang trọng nhé"
        });
        console.log("Hydrangea Turn 2:", res2.data);

        // Lượt 3: Xác nhận để gọi Gemini sinh ảnh 
        // (Chú ý: Nếu Gemini API Key chưa cấu hình đúng, Test này sẽ chủ động catch error từ API)
        const res3 = await axios.post(`${BASE_URL}/hydrangea/chat`, {
            sessionId: "test_user_123",
            isConfirming: true
        });
        console.log("Hydrangea Turn 3 (Gemini Calling):", res3.data);

    } catch (err) {
        console.error("Hydrangea Error:", err.message);
    }
}

async function runTests() {
    await testIris();
    await testHydrangea();
}

runTests();
