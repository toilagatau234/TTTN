const cron = require('node-cron');
const AIImage = require('../models/AIImage');
const { deleteImages } = require('../services/cloudinary.service');

// Chạy mỗi giờ một lần: '0 * * * *'
const startCleanupJobs = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Bắt đầu dọn dẹp các ảnh AI nháp (draft) hết hạn...');
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Tìm các ảnh draft cũ hơn 24h
            const expiredDrafts = await AIImage.find({
                status: 'draft',
                createdAt: { $lt: twentyFourHoursAgo }
            });

            if (expiredDrafts.length === 0) {
                console.log('[CRON] Không có ảnh nháp nào cần dọn dẹp.');
                return;
            }

            console.log(`[CRON] Tìm thấy ${expiredDrafts.length} ảnh nháp hết hạn.`);

            // Lấy danh sách public_id để xoá trên Cloudinary
            const publicIds = expiredDrafts.map(img => img.publicId).filter(Boolean);
            if (publicIds.length > 0) {
                await deleteImages(publicIds);
                console.log(`[CRON] Đã xóa ${publicIds.length} ảnh khỏi Cloudinary.`);
            }

            // Xóa khỏi Database
            const idsToDelete = expiredDrafts.map(img => img._id);
            await AIImage.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`[CRON] Đã xóa ${idsToDelete.length} bản ghi AIImage khỏi DB.`);

        } catch (error) {
            console.error('[CRON] Lỗi khi dọn dẹp ảnh nháp:', error);
        }
    });
};

module.exports = { startCleanupJobs };
