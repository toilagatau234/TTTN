const hydrangeaService  = require('./hydrangea.service');
const aiImagePipeline   = require('./aiImagePipeline.service');
const { checkGeminiApiKey } = require('./gemini.image.service');
const CustomBouquetOrder    = require('../../models/CustomBouquetOrder');
const AIImage = require('../../models/AIImage');
const { deleteImages, uploadBase64Image } = require('../../services/cloudinary.service');
const { protect } = require('../../middleware/auth');

// POST /api/ai/hydrangea/chat
exports.chatWithHydrangea = async (req, res) => {
    try {
        const { sessionId, message, isConfirming, entities } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, reply: 'Thiếu sessionId' });

        const result = await hydrangeaService.processChat(sessionId, message, isConfirming, entities);
        return res.status(200).json(result);
    } catch (error) {
        console.error('[Hydrangea Controller Error]:', error);
        return res.status(500).json({
            success: false,
            reply: 'Hệ thống AI đang quá tải, vui lòng thử lại sau!'
        });
    }
};

// POST /api/ai/hydrangea/update-items
// Frontend gửi lên items user đã chọn (override auto-select)
exports.updateSelectedItems = async (req, res) => {
    try {
        const { sessionId, selectedItems } = req.body;
        if (!sessionId) return res.status(400).json({ success: false });
        const totalPrice = hydrangeaService.updateSelectedItems(sessionId, selectedItems);
        return res.status(200).json({ success: true, totalPrice });
    } catch (error) {
        console.error('[UpdateItems Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/hydrangea/generate
// Tạo ảnh mới — return base64 preview (KHÔNG upload Cloudinary ngay)
// FIX v3: 1 ảnh, base64, no Cloudinary upload yet
exports.generateBouquetImage = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, reply: 'Thiếu sessionId' });

        const session = hydrangeaService.getSession(sessionId);

        // Gọi pipeline tạo 1 ảnh (return base64, no Cloudinary)
        const result = await aiImagePipeline.generateBouquetImages(
            session.entities,
            session.selectedItems
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                reply: result.error || 'Không thể tạo ảnh lúc này, vui lòng thử lại!',
                status: result.status || 'error'
            });
        }

        // Lưu vào session (chỉ lưu metadata, không lưu base64 để tránh nặng RAM)
        session.currentGenerationId = result.generationId;
        session.previewMimeType = result.mimeType;     // 'image/jpeg'
        session.promptUsed     = result.prompt_used;
        session.imageMetadata  = result.metadata;
        session.generatedImages = []; // Reset Cloudinary URLs (not uploaded yet)

        return res.status(200).json({
            success:       true,
            generationId:  result.generationId,
            imageBase64:   result.imageBase64,  // Trả về cho frontend giữ
            mimeType:      result.mimeType,     // 'image/jpeg'
            prompt_used:   result.prompt_used,
            metadata:      result.metadata,
            reply:         '✨ Đã tạo xong! Xem trước ảnh bên dưới rồi nhấn "Đồng ý & Chọn mua" nhé.',
            status:        'preview_ready',    // FIX: preview_ready = chưa upload Cloudinary
        });
    } catch (error) {
        console.error('[Generate Image Error]:', error);
        return res.status(500).json({ success: false, reply: error.message, status: 'error' });
    }
};

// POST /api/ai/hydrangea/refine-generate
// Tạo lại ảnh với prompt tùy chỉnh từ người dùng — return base64 preview
// FIX v3: return base64, not Cloudinary URL
exports.refineGenerate = async (req, res) => {
    try {
        const { sessionId, customPrompt } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, reply: 'Thiếu sessionId' });
        if (!customPrompt?.trim()) return res.status(400).json({ success: false, reply: 'Prompt không được trống' });

        const session = hydrangeaService.getSession(sessionId);

        const result = await aiImagePipeline.generateBouquetImages(
            session.entities,
            session.selectedItems,
            customPrompt.trim()
        );

        if (!result.success) {
            return res.status(500).json({ success: false, reply: result.error, status: result.status || 'error' });
        }

        // FIX v4: Save metadata only, not base64
        session.currentGenerationId = result.generationId;
        session.previewMimeType = result.mimeType;
        session.promptUsed     = result.prompt_used;
        session.imageMetadata  = result.metadata;
        session.generatedImages = [];  // Reset (not uploaded yet)

        return res.status(200).json({
            success:       true,
            generationId:  result.generationId,
            imageBase64:   result.imageBase64,
            mimeType:      result.mimeType,
            prompt_used:   result.prompt_used,
            metadata:      result.metadata,
            reply:         '✨ Đã tạo lại với prompt mới!',
            status:        'preview_ready',
        });
    } catch (error) {
        console.error('[RefineGenerate Error]:', error);
        return res.status(500).json({ success: false, reply: error.message, status: 'error' });
    }
};

// POST /api/ai/hydrangea/confirm-image-upload
// FIX v3: NEW ENDPOINT — Upload base64 to Cloudinary + save to session
// Called AFTER user confirms preview (Add to cart)
exports.confirmImageUpload = async (req, res) => {
    try {
        const { sessionId, generationId, imageBase64 } = req.body;
        if (!sessionId || !generationId || !imageBase64) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin (sessionId, generationId, imageBase64)' });
        }

        const session = hydrangeaService.getSession(sessionId);
        if (session.currentGenerationId !== generationId) {
            return res.status(400).json({ success: false, message: 'generationId không hợp lệ hoặc đã hết hạn' });
        }

        try {
            // Upload base64 to Cloudinary NOW (khi user confirm)
            const cloudinaryResult = await uploadBase64Image(
                imageBase64,
                'hydrangea-generated',
                session.previewMimeType || 'image/jpeg'
            );

            // FIX: Create an AIImage draft
            const userId = req.user?._id;
            if (!userId) {
                // Should not happen if route is protected, but just in case
                return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
            }

            const aiImage = await AIImage.create({
                user: userId,
                generationId: generationId,
                imageUrl: cloudinaryResult.url,
                publicId: cloudinaryResult.public_id,
                status: 'draft',
                metadata: JSON.stringify({
                    prompt: session.promptUsed,
                    flowers: session.imageMetadata?.flowers,
                    accessories: session.imageMetadata?.accessories
                })
            });

            // Save Cloudinary URL to session
            session.generatedImages = [
                {
                    url: cloudinaryResult.url,
                    public_id: cloudinaryResult.public_id,
                    aiImageId: aiImage._id // Save reference
                }
            ];

            console.log('[ConfirmImageUpload] ✅ Uploaded to Cloudinary and Draft Created:', aiImage._id);

            return res.status(200).json({
                success: true,
                aiImageId: aiImage._id,
                cloudinaryUrl: cloudinaryResult.url,
                public_id: cloudinaryResult.public_id,
                message: 'Ảnh đã được tải lên thành công!',
                status: 'image_confirmed'
            });
        } catch (err) {
            console.error('[ConfirmImageUpload] ❌ Cloudinary upload failed:', err.message);
            return res.status(500).json({
                success: false,
                message: `Lỗi tải ảnh lên: ${err.message}`,
                status: 'upload_failed'
            });
        }
    } catch (error) {
        console.error('[ConfirmImageUpload Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/hydrangea/confirm-order
// Tạo CustomBouquetOrder sau khi user chọn ảnh và đồng ý
exports.confirmOrder = async (req, res) => {
    try {
        const { sessionId, userDescription, note, selectedImageIndex } = req.body;
        const userId = req.user?._id;

        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        if (!sessionId) return res.status(400).json({ success: false, message: 'Thiếu sessionId' });

        const session      = hydrangeaService.getSession(sessionId);
        const selIdx       = Number.isInteger(selectedImageIndex) ? selectedImageIndex : 0;
        const allImages    = session.generatedImages || [];
        const selectedImg  = allImages[selIdx] || allImages[0] || null;
        const unselected   = allImages.filter((_, i) => i !== selIdx);

        // Xóa các ảnh KHÔNG được chọn khỏi Cloudinary (dọn dẹp storage)
        if (unselected.length > 0) {
            const unusedIds = unselected.map(img => img.public_id).filter(Boolean);
            if (unusedIds.length > 0) {
                deleteImages(unusedIds).catch(err =>
                    console.warn('[ConfirmOrder] Xóa ảnh không dùng thất bại:', err.message)
                );
            }
        }

        let order;
        try {
            order = await hydrangeaService.createOrder(
                sessionId, userId, userDescription, note,
                selectedImg, session.promptUsed, session.imageMetadata
            );

            // FIX: Mark AIImage as used
            if (selectedImg && selectedImg.aiImageId) {
                await AIImage.findByIdAndUpdate(selectedImg.aiImageId, { status: 'used' });
            }
        } catch (dbError) {
            console.error('[ConfirmOrder Error]:', dbError);
            // SOFT ROLLBACK: DO NOTHING to the image. It stays as "draft" in AIImage.
            return res.status(500).json({ 
                success: false, 
                message: dbError.message,
                isDraftSaved: true // Tell frontend the draft is saved
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Đơn hàng tùy chỉnh đã được lưu!',
            order: {
                _id:       order._id,
                orderCode: order.orderCode,
                status:    order.status,
                totalPrice: order.totalPrice,
                createdAt: order.createdAt,
            }
        });
    } catch (error) {
        console.error('[ConfirmOrder Outer Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ai/hydrangea/my-orders
// Lấy lịch sử đơn custom của user
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false });

        const orders = await CustomBouquetOrder.find({ user: userId })
            .select('orderCode status totalPrice entities generatedImage.url createdAt confirmedAt selectedItems sessionId')
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();

        // Tạo orderCode virtual cho lean docs
        const result = orders.map(o => ({
            ...o,
            orderCode: `CB-${String(o._id).slice(-8).toUpperCase()}`
        }));

        return res.status(200).json({ success: true, orders: result });
    } catch (error) {
        console.error('[GetMyOrders Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ai/hydrangea/orders/:id
// Chi tiết 1 đơn
exports.getOrderDetail = async (req, res) => {
    try {
        const userId = req.user?._id;
        const order = await CustomBouquetOrder.findOne({ _id: req.params.id, user: userId }).lean();
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

        return res.status(200).json({
            success: true,
            order: {
                ...order,
                orderCode: `CB-${String(order._id).slice(-8).toUpperCase()}`
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/hydrangea/restore-session
// Khôi phục phiên làm việc từ order cũ
exports.restoreSession = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { orderId } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu orderId' });

        const sessionState = await hydrangeaService.restoreSession(orderId, userId);
        if (!sessionState) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        return res.status(200).json({
            success: true,
            sessionState
        });
    } catch (error) {
        console.error('[RestoreSession Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/ai/hydrangea/orders/:id
// Xóa lịch sử thiết kế
exports.deleteOrder = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });

        const order = await CustomBouquetOrder.findOneAndDelete({ _id: id, user: userId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        return res.status(200).json({
            success: true,
            message: 'Đã xóa lịch sử thiết kế'
        });
    } catch (error) {
        console.error('[DeleteOrder Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ai/hydrangea/check-api
// Kiểm tra Gemini API key
exports.checkApi = async (req, res) => {
    try {
        const status = await checkGeminiApiKey();
        return res.status(200).json({ success: true, gemini: status });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── NEW: DRAFT IMAGES APIs ──────────────────────────────────────────────────

// GET /api/ai/hydrangea/images/drafts
exports.getDraftImages = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });

        const drafts = await AIImage.find({ user: userId, status: 'draft' })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ success: true, drafts });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/hydrangea/images/retry
exports.retryOrderFromDraft = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { aiImageId, note, userDescription, sessionId } = req.body;
        
        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        if (!aiImageId || !sessionId) return res.status(400).json({ success: false, message: 'Thiếu thông tin aiImageId hoặc sessionId' });

        const draft = await AIImage.findOne({ _id: aiImageId, user: userId, status: 'draft' });
        if (!draft) return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh nháp' });

        const session = hydrangeaService.getSession(sessionId);

        // Fake a selectedImg object for createOrder
        const selectedImg = {
            url: draft.imageUrl,
            public_id: draft.publicId,
            aiImageId: draft._id
        };

        const order = await hydrangeaService.createOrder(
            sessionId, userId, userDescription || draft.metadata?.prompt, note,
            selectedImg, draft.metadata?.prompt, draft.metadata
        );

        // Update draft status
        await AIImage.findByIdAndUpdate(draft._id, { status: 'used' });

        return res.status(201).json({
            success: true,
            message: 'Đơn hàng tùy chỉnh đã được lưu từ bản nháp!',
            order: {
                _id:       order._id,
                orderCode: order.orderCode,
                status:    order.status,
                totalPrice: order.totalPrice,
                createdAt: order.createdAt,
            }
        });
    } catch (error) {
        console.error('[RetryOrder Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/ai/hydrangea/images/:id
exports.deleteDraftImage = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        
        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });

        const draft = await AIImage.findOne({ _id: id, user: userId, status: 'draft' });
        if (!draft) return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh nháp' });

        // Delete from Cloudinary
        if (draft.publicId) {
            deleteImages([draft.publicId]).catch(err => console.warn('Cloudinary delete warning:', err.message));
        }

        await AIImage.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: 'Đã xóa ảnh nháp' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};