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

    // Image state — v2: Cloudinary URLs
    const [generatedImages, setGeneratedImages]         = useState([]);    // [{ url, public_id }]
    const [selectedImageIndex, setSelectedImageIndex]   = useState(0);
    const [isGenerating, setIsGenerating]               = useState(false);
    const [generateError, setGenerateError]             = useState(null);  // string | null
    const [promptUsed, setPromptUsed]                   = useState('');
    const [detectedType, setDetectedType]               = useState(null);  // 'bouquet' | 'basket' | ...
    const [customPrompt, setCustomPrompt]               = useState('');    // cho refine flow

    // Order state
    const [myOrders, setMyOrders]         = useState([]);
    const [showOrders, setShowOrders]     = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [savedOrder, setSavedOrder]     = useState(null);

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
    const handleGenerate = useCallback(async (overridePrompt = null) => {
        setIsGenerating(true);
        setGeneratedImages([]);
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

            if (d.success && d.images?.length > 0) {
                setGeneratedImages(d.images);             // [{ url, public_id }]
                setPromptUsed(d.prompt_used || '');
                setDetectedType(d.metadata?.type || null);
                setStatus('image_ready');
                setCustomPrompt(d.prompt_used || '');
                addBotMsg('🌸 Xong rồi! Chọn ảnh bạn thích và nhấn "Đồng ý & Chọn Mua" nhé.');
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

    // ── Xác nhận đơn hàng ───────────────────────────────────────────────────
    const handleConfirmOrder = useCallback(async () => {
        const token = authService.getToken();
        if (!token) { addBotMsg('Vui lòng đăng nhập để lưu đơn!'); return; }
        if (generatedImages.length === 0) { addBotMsg('Vui lòng tạo ảnh trước!'); return; }

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
            addBotMsg(err.response?.data?.message || 'Lỗi khi lưu đơn.');
        } finally {
            setIsSavingOrder(false);
        }
    }, [sessionId, entities, generatedImages, selectedImageIndex]);

    // ── Tải lịch sử đơn ─────────────────────────────────────────────────────
    const loadMyOrders = useCallback(async () => {
        const token = authService.getToken();
        if (!token) return;
        try {
            const res = await axios.get(`${API}/ai/hydrangea/my-orders`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setMyOrders(res.data.orders);
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
        // Image state
        generatedImages, selectedImageIndex, isGenerating, generateError,
        promptUsed, detectedType, customPrompt, setCustomPrompt,
        // Order state
        myOrders, showOrders, setShowOrders, isSavingOrder, savedOrder,
        // Refs
        chatEndRef,
        // Actions
        sendMessage, handleSelectItem, handleGenerate, handleRefine,
        handleSelectImage, handleConfirmOrder, loadMyOrders,
        startNewChat, resumeChat, deleteHistory,
    };
}
