const mongoose = require('mongoose');
const HydrangeaService = require('../ai/hydrangea/hydrangea.service');
const aiImagePipeline = require('../ai/hydrangea/aiImagePipeline.service');
require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const service = HydrangeaService;
    
    // Simulate user message
    const msg = "tôi muốn tạo 1 bó hoa cẩm tú cầu, sử dụng ruy băng xanh dương và giấy gói màu vàng";
    
    // Create a fake user session
    const sessionId = "test_session_123";
    
    const result = await service.processMessage(sessionId, msg, 'test_user');
    
    console.log("TEST RESULT:", JSON.stringify(result, null, 2));
    
    process.exit(0);
}
test();
