const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // MongoDB TTL: tự xoá khi expiresAt qua
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Xoá OTP cũ khi gửi mã mới cho cùng email
otpSchema.statics.deleteByEmail = async function (email) {
    await this.deleteMany({ email: email.toLowerCase().trim() });
};

module.exports = mongoose.model('Otp', otpSchema);
