import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import authService from '../../../services/authService';

const API = 'http://localhost:8080/api';

export function useHydrangeaStudio() {
    const defaultMessages = [{
        role: 'bot',
        text: 'Chào mừng đến Hydrangea Studio! 🌸 Bạn muốn giỏ hoa như thế nào? Mô tả cho mình nghe nào!',
        quickChips: ['Giỏ hoa hồng đỏ sinh nhật', 'Hoa tím lavender 500k', 'Lẵng hướng dương khai trương']
    }];
    
    const [sessionId, setSessionId] = useState(() => `sess_${Math.random().toString(36).slice(2, 9)}`);
    const [messages, setMessages] = useState(defaultMessages);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // AI state
    const [entities, setEntities] = useState({});
    const [suggestedItems, setSuggestedItems] = useState(null);
    const [selectedItems, setSelectedItems] = useState({ basket: null, wrapper: null, ribbon: null, main_flowers: [], sub_flowers: [], accessories: [] });
    const [outOfStockWarnings, setOutOfStockWarnings] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [status, setStatus] = useState('idle'); // idle | asking | suggesting | generating | image_ready

    // Image state
    const [generatedImage, setGeneratedImage] = useState(null); // { base64, mimeType }
    const [isGenerating, setIsGenerating] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Order state
    const [myOrders, setMyOrders] = useState([]);
    const [showOrders, setShowOrders] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [savedOrder, setSavedOrder] = useState(null);

    const chatEndRef = useRef(null);

    const addBotMsg = (text, chips = null) => {
        setMessages(prev => [...prev, { role: 'bot', text, quickChips: chips }]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    };

    const sendMessage = useCallback(async (text) => {
        if (!text?.trim() || isLoading) return;
        setMessages(prev => [...prev, { role: 'user', text }]);
        setInputText('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API}/ai/hydrangea/chat`, { sessionId, message: text });
            const d = res.data;
            if (d.success) {
                addBotMsg(d.reply, d.quickChips || null);
                if (d.extractedEntities) setEntities(prev => ({ ...prev, ...d.extractedEntities }));
                if (d.suggestedItems) setSuggestedItems(d.suggestedItems);
                if (d.selectedItems) setSelectedItems(d.selectedItems);
                if (d.outOfStockWarnings) setOutOfStockWarnings(d.outOfStockWarnings);
                if (d.totalPrice) setTotalPrice(d.totalPrice);
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

    const handleSelectItem = useCallback(async (category, product) => {
        const newSelected = { ...selectedItems };
        if (['main_flowers', 'sub_flowers', 'accessories'].includes(category)) {
            const arr = newSelected[category] || [];
            const exists = arr.some(p => String(p._id) === String(product._id));
            newSelected[category] = exists ? arr.filter(p => String(p._id) !== String(product._id)) : [...arr, product];
        } else {
            newSelected[category] = newSelected[category]?._id === product._id ? null : product;
        }
        setSelectedItems(newSelected);
        try {
            const res = await axios.post(`${API}/ai/hydrangea/update-items`, { sessionId, selectedItems: newSelected });
            if (res.data.success) setTotalPrice(res.data.totalPrice);
        } catch { /* silent */ }
    }, [sessionId, selectedItems]);

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        setGeneratedImage(null);
        addBotMsg('✨ Đang tạo ảnh giỏ hoa, chờ mình xíu...');
        try {
            const res = await axios.post(`${API}/ai/hydrangea/generate`, { sessionId }, { timeout: 60000 });
            const d = res.data;
            if (d.success && d.imageBase64) {
                setGeneratedImage({ base64: d.imageBase64, mimeType: d.mimeType || 'image/png' });
                setStatus('image_ready');
                setShowConfirmModal(true);
                addBotMsg('🌸 Ảnh đã xong! Xem và xác nhận đơn nhé.');
            } else {
                addBotMsg(`❌ ${d.reply || 'Không thể tạo ảnh lúc này.'}`);
            }
        } catch (err) {
            const msg = err.response?.data?.reply || 'Lỗi kết nối khi tạo ảnh.';
            addBotMsg(`❌ ${msg}`);
        } finally {
            setIsGenerating(false);
        }
    }, [sessionId]);

    const handleConfirmOrder = useCallback(async () => {
        const token = authService.getToken();
        if (!token) { addBotMsg('Vui lòng đăng nhập để lưu đơn!'); return; }
        setIsSavingOrder(true);
        try {
            const desc = entities.flower_types?.join(', ') || 'giỏ hoa tùy chỉnh';
            const res = await axios.post(`${API}/ai/hydrangea/confirm-order`,
                { sessionId, userDescription: desc },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setSavedOrder(res.data.order);
                
                try {
                    await axios.post(`${API}/cart/custom`, 
                        { orderId: res.data.order._id }, 
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    addBotMsg(`🎉 Đơn **${res.data.order.orderCode}** đã được thêm vào Giỏ hàng! Bạn có thể tiến hành thanh toán ngay.`);
                } catch (cartErr) {
                    console.error("Cart add error", cartErr);
                    addBotMsg(`🎉 Đơn **${res.data.order.orderCode}** đã lưu, nhưng có lỗi nhỏ khi đẩy vào giỏ hàng.`);
                }
            }
        } catch (err) {
            addBotMsg(err.response?.data?.message || 'Lỗi khi lưu đơn.');
        } finally {
            setIsSavingOrder(false);
        }
    }, [sessionId, entities]);

    const loadMyOrders = useCallback(async () => {
        const token = authService.getToken();
        if (!token) return;
        try {
            const res = await axios.get(`${API}/ai/hydrangea/my-orders`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setMyOrders(res.data.orders);
        } catch { /* silent */ }
    }, []);

    const startNewChat = useCallback(() => {
        setSessionId(`sess_${Math.random().toString(36).slice(2, 9)}`);
        setMessages(defaultMessages);
        setEntities({});
        setSuggestedItems(null);
        setSelectedItems({ basket: null, wrapper: null, ribbon: null, main_flowers: [], sub_flowers: [], accessories: [] });
        setOutOfStockWarnings([]);
        setTotalPrice(0);
        setStatus('idle');
        setGeneratedImage(null);
        setSavedOrder(null);
        setShowConfirmModal(false);
    }, []);

    const resumeChat = useCallback(async (orderId) => {
        const token = authService.getToken();
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await axios.post(`${API}/ai/hydrangea/restore-session`, 
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
                setGeneratedImage(s.generatedImage || null);
                setStatus(s.status || 'idle');
            }
        } catch (err) {
            addBotMsg('❌ Không thể tải lại đơn hàng cũ.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        sessionId, messages, inputText, setInputText, isLoading,
        entities, suggestedItems, selectedItems, outOfStockWarnings, totalPrice, status,
        generatedImage, isGenerating, showConfirmModal, setShowConfirmModal,
        myOrders, showOrders, setShowOrders, isSavingOrder, savedOrder,
        chatEndRef, sendMessage, handleSelectItem, handleGenerate, handleConfirmOrder, loadMyOrders,
        startNewChat, resumeChat
    };
}
