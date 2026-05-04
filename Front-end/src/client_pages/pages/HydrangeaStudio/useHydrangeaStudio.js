import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import authService from '../../../services/authService';

const API = 'http://localhost:8080/api';

export function useHydrangeaStudio() {
    const defaultMessages = [{
        role: 'bot',
        text: 'Chào mừng đến Hydrangea Studio! 🌸 Bạn muốn giỏ hoa như thế nào? Mô tả cho mình nghe nào!',
        quickChips: ['Bó hoa hồng đỏ sinh nhật', 'Giỏ hoa tím lavender 500k', 'Lẵng hướng dương khai trương']
    }];

    const [sessionId, setSessionId]   = useState(() => `sess_${Math.random().toString(36).slice(2, 9)}`);
    const [messages, setMessages]     = useState(defaultMessages);
    const [inputText, setInputText]   = useState('');
    const [isLoading, setIsLoading]   = useState(false);

    // AI state
    const [entities, setEntities]                   = useState({});
    const [suggestedItems, setSuggestedItems]       = useState(null);
    const [selectedItems, setSelectedItems]         = useState({ basket: null, wrapper: null, ribbon: null, main_flowers: [], sub_flowers: [], accessories: [] });
    const [outOfStockWarnings, setOutOfStockWarnings] = useState([]);
    const [totalPrice, setTotalPrice]               = useState(0);
    const [status, setStatus]                       = useState('idle');

    // Image state — v3 FIX: base64 preview → confirm → Cloudinary URL
    const [previewBase64, setPreviewBase64]              = useState(null);  // base64 string (temporary)
    const [generationId, setGenerationId]                = useState(null);  // FIX v4: Store generationId
    const [generatedImages, setGeneratedImages]         = useState([]);    // [{ url, public_id }] (Cloudinary - after confirm)
    const [selectedImageIndex, setSelectedImageIndex]   = useState(0);
    const [isGenerating, setIsGenerating]               = useState(false);
    const [generateError, setGenerateError]             = useState(null);  // string | null
    const [promptUsed, setPromptUsed]                   = useState('');
    const [detectedType, setDetectedType]               = useState(null);  // 'bouquet' | 'basket' | ...
    const [customPrompt, setCustomPrompt]               = useState('');    // cho refine flow
    const [isConfirmingImage, setIsConfirmingImage]     = useState(false); // FIX: loading state for upload

    // Order state
    const [myOrders, setMyOrders]         = useState([]);
    const [showOrders, setShowOrders]     = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [savedOrder, setSavedOrder]     = useState(null);
    const [aiImageId, setAiImageId]       = useState(null); // FIX v4: Store aiImageId

    // Draft Images state
    const [draftImages, setDraftImages]   = useState([]);
    const [showDrafts, setShowDrafts]     = useState(false);

    const chatEndRef = useRef(null);

    const addBotMsg = (text, chips = null) => {
        setMessages(prev => [...prev, { role: 'bot', text, quickChips: chips }]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    };

    // ── Gửi tin nhắn chat ────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        if (!text?.trim() || isLoading) return;
        setMessages(prev => [...prev, { role: 'user', text }]);
        setInputText('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API}/ai/hydrangea/chat`, { sessionId, message: text });
            const d   = res.data;
            if (d.success) {
                addBotMsg(d.reply, d.quickChips || null);
                if (d.extractedEntities) setEntities(prev => ({ ...prev, ...d.extractedEntities }));
                if (d.suggestedItems)    setSuggestedItems(d.suggestedItems);
                if (d.selectedItems)     setSelectedItems(d.selectedItems);
                if (d.outOfStockWarnings) setOutOfStockWarnings(d.outOfStockWarnings);
                if (d.totalPrice)        setTotalPrice(d.totalPrice);
                setStatus(d.status || 'idle');
            } else {
                addBotMsg(d.reply || 'Có lỗi xảy ra.');
            }
        } catch {
            addBotMsg('😔 Máy chủ đang bận, thử lại sau nhé!');
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, isLoading]);

    // ── Chọn item trong panel ────────────────────────────────────────────────
    const handleSelectItem = useCallback(async (category, product) => {
        const newSelected = { ...selectedItems };
        if (['main_flowers', 'sub_flowers', 'accessories'].includes(category)) {
            const arr    = newSelected[category] || [];
            const exists = arr.some(p => String(p._id) === String(product._id));
            newSelected[category] = exists
                ? arr.filter(p => String(p._id) !== String(product._id))
                : [...arr, product];
        } else {
            newSelected[category] = newSelected[category]?._id === product._id ? null : product;
        }
        setSelectedItems(newSelected);
        try {
            const res = await axios.post(`${API}/ai/hydrangea/update-items`, { sessionId, selectedItems: newSelected });
            if (res.data.success) setTotalPrice(res.data.totalPrice);
        } catch { /* silent */ }
    }, [sessionId, selectedItems]);

    // ── Tạo ảnh (generate / regenerate) ─────────────────────────────────────
    // FIX v3: Return base64 preview (KHÔNG upload Cloudinary ngay)
    const handleGenerate = useCallback(async (overridePrompt = null) => {
        setIsGenerating(true);
        setPreviewBase64(null);  // FIX: Clear previous preview
        setGenerationId(null);   // FIX v4: Clear previous generationId
        setGeneratedImages([]);  // FIX: Clear Cloudinary URLs (not uploaded yet)
        setGenerateError(null);
        setSelectedImageIndex(0);
        setStatus('generating');
        addBotMsg('✨ Đang tạo ảnh giỏ hoa, chờ mình xíu nhé...');

        try {
            const endpoint = overridePrompt ? `${API}/ai/hydrangea/refine-generate` : `${API}/ai/hydrangea/generate`;
            const payload  = overridePrompt
                ? { sessionId, customPrompt: overridePrompt }
                : { sessionId };

            const res = await axios.post(endpoint, payload, { timeout: 60000 });
            const d   = res.data;

            // FIX v3/v4: Expect imageBase64 and generationId instead of images array
            if (d.success && d.imageBase64 && d.generationId) {
                setPreviewBase64(d.imageBase64);  // FIX: Store base64 preview
                setGenerationId(d.generationId);  // FIX v4: Store generationId
                setPromptUsed(d.prompt_used || '');
                setDetectedType(d.metadata?.type || null);
                setStatus('preview_ready');  // FIX: New status
                setCustomPrompt(d.prompt_used || '');
                addBotMsg('🌸 Xong rồi! Xem trước ảnh bên dưới rồi nhấn "Đồng ý & Chọn mua" nhé.');
            } else {
                const errMsg = d.reply || 'Không thể tạo ảnh lúc này.';
                setGenerateError(errMsg);
                setStatus('error');
                addBotMsg(`❌ ${errMsg}`);
            }
        } catch (err) {
            const errMsg = err.response?.data?.reply
                || (err.code === 'ECONNABORTED' ? 'Tạo ảnh quá lâu, vui lòng thử lại.' : 'Lỗi kết nối khi tạo ảnh.');
            setGenerateError(errMsg);
            setStatus('error');
            addBotMsg(`❌ ${errMsg}`);
        } finally {
            setIsGenerating(false);
        }
    }, [sessionId]);

    // ── Tinh chỉnh prompt (refine) ───────────────────────────────────────────
    const handleRefine = useCallback((prompt) => {
        if (!prompt?.trim()) return;
        handleGenerate(prompt.trim());
    }, [handleGenerate]);

    // ── Chọn ảnh ────────────────────────────────────────────────────────────
    const handleSelectImage = useCallback((idx) => {
        setSelectedImageIndex(idx);
    }, []);

    // ── Xác nhận & Upload ảnh ───────────────────────────────────────────────
    // FIX v3: NEW FUNCTION — Confirm preview + upload base64 to Cloudinary
    const handleConfirmImageUpload = useCallback(async () => {
        if (!previewBase64) {
            addBotMsg('Không có ảnh preview để upload.');
            return;
        }

        setIsConfirmingImage(true);
        setGenerateError(null);

        try {
            const token = authService.getToken();
            const res = await axios.post(`${API}/ai/hydrangea/confirm-image-upload`, {
                sessionId,
                generationId,
                imageBase64: previewBase64
            }, { 
                timeout: 30000,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const d = res.data;
            if (d.success && d.cloudinaryUrl) {
                // FIX v4: Store aiImageId
                if (d.aiImageId) setAiImageId(d.aiImageId);
                
                // FIX: Move from preview to Cloudinary URLs
                setGeneratedImages([{
                    url: d.cloudinaryUrl,
                    public_id: d.public_id,
                    aiImageId: d.aiImageId
                }]);
                setPreviewBase64(null);  // FIX: Clear preview
                setStatus('image_confirmed');
                addBotMsg('✅ Ảnh đã được lưu! Nhấn "Đồng ý & Chọn mua" để thêm vào giỏ.');
                return true;
            } else {
                setGenerateError(d.message || 'Lỗi khi tải ảnh lên');
                addBotMsg(`❌ ${d.message || 'Lỗi khi tải ảnh lên'}`);
                return false;
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Lỗi kết nối khi tải ảnh lên';
            setGenerateError(errMsg);
            addBotMsg(`❌ ${errMsg}`);
            return false;
        } finally {
            setIsConfirmingImage(false);
        }
    }, [sessionId, generationId, previewBase64]);

    // ── Xác nhận đơn hàng ───────────────────────────────────────────────────
    // FIX v3: Confirm image upload FIRST (if not yet), then create order
    const handleConfirmOrder = useCallback(async () => {
        const token = authService.getToken();
        if (!token) { addBotMsg('Vui lòng đăng nhập để lưu đơn!'); return; }

        // FIX v3: If preview still exists, must confirm upload first
        if (previewBase64 && !generatedImages.length) {
            setIsConfirmingImage(true);
            const uploadSuccess = await handleConfirmImageUpload();
            setIsConfirmingImage(false);
            if (!uploadSuccess) return;  // Stop if upload failed
        }

        // Now generatedImages should have Cloudinary URLs
        if (generatedImages.length === 0) { addBotMsg('Vui lòng tạo và xác nhận ảnh trước!'); return; }

        setIsSavingOrder(true);
        try {
            const desc = entities.flower_types?.join(', ') || 'giỏ hoa tùy chỉnh';
            const res  = await axios.post(
                `${API}/ai/hydrangea/confirm-order`,
                { sessionId, userDescription: desc, selectedImageIndex },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setSavedOrder(res.data.order);
                try {
                    await axios.post(
                        `${API}/cart/custom`,
                        { orderId: res.data.order._id },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    addBotMsg(`🎉 Đơn **${res.data.order.orderCode}** đã được thêm vào Giỏ hàng!`);
                } catch {
                    addBotMsg(`🎉 Đơn **${res.data.order.orderCode}** đã lưu.`);
                }
                loadMyOrders();
            }
        } catch (err) {
            const d = err.response?.data;
            if (d?.isDraftSaved) {
                addBotMsg(`❌ Đơn hàng thất bại: ${d.message}\n\n💡 *Mẫu hoa của bạn đã được lưu lại trong mục "Thiết kế của bạn". Bạn có thể xem lại và thử đặt hàng lại nhé!*`);
                loadDraftImages();
            } else {
                addBotMsg(d?.message || 'Lỗi khi lưu đơn.');
            }
        } finally {
            setIsSavingOrder(false);
        }
    }, [sessionId, entities, generatedImages, selectedImageIndex, previewBase64, handleConfirmImageUpload]);

    // ── Tải lịch sử đơn ─────────────────────────────────────────────────────
    const loadMyOrders = useCallback(async () => {
        const token = authService.getToken();
        if (!token) return;
        try {
            const res = await axios.get(`${API}/ai/hydrangea/my-orders`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setMyOrders(res.data.orders);
        } catch { /* silent */ }
    }, []);

    // ── Tải ảnh nháp (Drafts) ───────────────────────────────────────────────
    const loadDraftImages = useCallback(async () => {
        const token = authService.getToken();
        if (!token) return;
        try {
            const res = await axios.get(`${API}/ai/hydrangea/images/drafts`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setDraftImages(res.data.drafts);
        } catch { /* silent */ }
    }, []);

    // ── Thử lại đơn hàng từ nháp ────────────────────────────────────────────
    const retryOrderFromDraft = useCallback(async (draftId) => {
        const token = authService.getToken();
        if (!token) { addBotMsg('Vui lòng đăng nhập!'); return; }
        
        setIsSavingOrder(true);
        addBotMsg('🔄 Đang khởi tạo lại đơn hàng từ mẫu thiết kế của bạn...');
        try {
            const res = await axios.post(
                `${API}/ai/hydrangea/images/retry`,
                { aiImageId: draftId, sessionId, userDescription: 'Đặt lại từ bản nháp' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setSavedOrder(res.data.order);
                addBotMsg(`🎉 Đơn **${res.data.order.orderCode}** đã tạo thành công từ bản nháp!`);
                loadMyOrders();
                loadDraftImages();
                setAiImageId(null);
            }
        } catch (err) {
            addBotMsg(err.response?.data?.message || 'Lỗi khi tạo lại đơn.');
        } finally {
            setIsSavingOrder(false);
        }
    }, [sessionId, loadMyOrders, loadDraftImages]);

    // ── Xóa ảnh nháp ────────────────────────────────────────────────────────
    const deleteDraftImage = useCallback(async (draftId) => {
        const token = authService.getToken();
        if (!token) return;
        try {
            const res = await axios.delete(`${API}/ai/hydrangea/images/${draftId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDraftImages(prev => prev.filter(d => d._id !== draftId));
            }
        } catch { /* silent */ }
    }, []);

    // ── Chat mới ─────────────────────────────────────────────────────────────
    const startNewChat = useCallback(() => {
        setSessionId(`sess_${Math.random().toString(36).slice(2, 9)}`);
        setMessages(defaultMessages);
        setEntities({});
        setSuggestedItems(null);
        setSelectedItems({ basket: null, wrapper: null, ribbon: null, main_flowers: [], sub_flowers: [], accessories: [] });
        setOutOfStockWarnings([]);
        setTotalPrice(0);
        setStatus('idle');
        setPreviewBase64(null);  // FIX: Clear preview
        setGenerationId(null);   // FIX: Clear generationId
        setGeneratedImages([]);
        setSelectedImageIndex(0);
        setGenerateError(null);
        setPromptUsed('');
        setDetectedType(null);
        setCustomPrompt('');
        setSavedOrder(null);
    }, []);

    // ── Khôi phục session cũ ─────────────────────────────────────────────────
    const resumeChat = useCallback(async (orderId) => {
        const token = authService.getToken();
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await axios.post(
                `${API}/ai/hydrangea/restore-session`,
                { orderId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success && res.data.sessionState) {
                const s = res.data.sessionState;
                setSessionId(s.sessionId);
                setMessages(s.messages || defaultMessages);
                setEntities(s.entities || {});
                setSelectedItems(s.selectedItems || { basket: null, wrapper: null, ribbon: null, main_flowers: [], sub_flowers: [], accessories: [] });
                setTotalPrice(s.totalPrice || 0);
                setStatus(s.status || 'idle');
                // Khôi phục ảnh Cloudinary (URL)
                if (s.generatedImages?.length > 0) {
                    setGeneratedImages(s.generatedImages);
                    setStatus('image_ready');
                }
            }
        } catch {
            addBotMsg('❌ Không thể tải lại đơn hàng cũ.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Xóa lịch sử ─────────────────────────────────────────────────────────
    const deleteHistory = useCallback(async (orderId) => {
        const token = authService.getToken();
        if (!token) return;
        try {
            const res = await axios.delete(`${API}/ai/hydrangea/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMyOrders(prev => prev.filter(o => o._id !== orderId));
            }
        } catch (err) {
            console.error('Delete history error', err);
        }
    }, []);

    return {
        sessionId, messages, inputText, setInputText, isLoading,
        entities, suggestedItems, selectedItems, outOfStockWarnings, totalPrice, status,
        // Image state — FIX v3: Added previewBase64, isConfirmingImage
        previewBase64, generationId, generatedImages, selectedImageIndex, isGenerating, generateError, isConfirmingImage,
        promptUsed, detectedType, customPrompt, setCustomPrompt,
        // Order state
        myOrders, showOrders, setShowOrders, isSavingOrder, savedOrder,
        draftImages, showDrafts, setShowDrafts, // FIX v4: Draft states
        // Refs
        chatEndRef,
        // Actions — FIX v3: Added handleConfirmImageUpload
        sendMessage, handleSelectItem, handleGenerate, handleRefine,
        handleSelectImage, handleConfirmImageUpload, handleConfirmOrder, loadMyOrders,
        startNewChat, resumeChat, deleteHistory,
        loadDraftImages, retryOrderFromDraft, deleteDraftImage, // FIX v4: Draft actions
    };
}
