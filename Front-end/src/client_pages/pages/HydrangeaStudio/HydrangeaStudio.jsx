import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, Sparkles, ShoppingCart, Star, Search, RefreshCw, ImageIcon, Tag, Flower2, Package } from 'lucide-react';
import authService from '../../../services/authService';

const API = 'http://localhost:8080/api';

const HydrangeaStudio = () => {
    // ── State ────────────────────────────────────────────────────────
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Chào mừng bạn đến với Hydrangea Studio! 🌸 Mình là trợ lý AI thiết kế giỏ hoa của Rosee. Bạn muốn giỏ hoa như thế nào — tông màu, loài hoa, hay dịp tặng gì?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isAiMode, setIsAiMode] = useState(true);
    const abortRef = useRef(null);
    const debounceRef = useRef(null);

    // AI state
    const [currentEntities, setCurrentEntities] = useState({});
    const [classification, setClassification] = useState({ main: [], secondary: [] });
    const [suggestedProducts, setSuggestedProducts] = useState([]);

    // Image state
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageGenerated, setImageGenerated] = useState(false); // inline preview

    // Basket
    const [customBasket, setCustomBasket] = useState({ products: [], flowers: [], colors: [], totalPrice: 0 });
    // AI Bouquet summary (từ handleSuggest response)
    const [bouquetSummary, setBouquetSummary] = useState(null); // { items, total_price, explanation }
    const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 9)}`);

    const chatEndRef = useRef(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

    // ── Send message ─────────────────────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const userMsg = { role: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const resp = await axios.post(`${API}/ai/hydrangea/chat`, {
                sessionId,
                message: userMsg.text
            });

            const { success, reply, extractedEntities, suggestedProducts: products, classification: cls, current_bouquet } = resp.data;

            if (success) {
                setMessages(prev => [...prev, { role: 'bot', text: reply }]);
                if (extractedEntities) setCurrentEntities(prev => ({ ...prev, ...extractedEntities }));
                if (products?.length > 0) setSuggestedProducts(products);
                if (cls) setClassification(cls);
                if (current_bouquet) setBouquetSummary(current_bouquet);
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: reply || 'Có lỗi xảy ra.' }]);
            }
        } catch (error) {
            console.error('[Chat error]:', error);
            setMessages(prev => [...prev, { role: 'bot', text: '😔 Máy chủ đang bảo trì, bạn thử lại chút sau nhé!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Generate image from entities (AI chat flow) ──────────────────
    const handleGenerateFromEntities = async () => {
        if (isGeneratingImage || !Object.keys(currentEntities).length) return;
        setIsGeneratingImage(true);
        setGeneratedImage(null);
        setImageGenerated(false);

        try {
            const resp = await axios.post(`${API}/generate-image`, { entities: currentEntities });
            if (resp.data.success) {
                const url = `http://localhost:8080${resp.data.image_url}`;
                setGeneratedImage(url);
                setImageGenerated(true);

                // Cập nhật bouquet summary từ output chuẩn
                if (resp.data.items) {
                    setBouquetSummary({
                        items: resp.data.items,
                        total_price: resp.data.total_price || 0,
                        explanation: resp.data.explanation || ''
                    });
                }

                const layoutMsg = resp.data.layout_used ? ` (layout: ${resp.data.layout_used})` : '';
                const priceMsg = resp.data.total_price
                    ? ` — Tổng khoảng ${new Intl.NumberFormat('vi-VN').format(resp.data.total_price)}đ`
                    : '';
                setMessages(prev => [...prev, {
                    role: 'bot',
                    text: `✨ Giỏ hoa của bạn đã hoàn thiện!${layoutMsg}${priceMsg}`
                }]);
            }
        } catch (err) {
            console.error('[Image gen error]:', err);
            setMessages(prev => [...prev, { role: 'bot', text: '🌸 Chưa thể render giỏ hoa ngay lúc này. Thử lại sau nhé!' }]);
        } finally {
            setIsGeneratingImage(false);
        }
    };


    // ── Generate from product ─────────────────────────────────────────
    const handleGenerateFromProduct = async (productId) => {
        if (isGeneratingImage) return;
        setIsGeneratingImage(true);
        setGeneratedImage(null);
        setImageGenerated(false);

        try {
            const resp = await axios.post(`${API}/generate-image`, { product_id: productId });
            if (resp.data.success) {
                const url = `http://localhost:8080${resp.data.image_url}`;
                setGeneratedImage(url);
                setImageGenerated(true);
                setShowImageModal(true);
            }
        } catch (err) {
            console.error('[Image gen product error]:', err);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // ── Add to cart ───────────────────────────────────────────────────
    const handleAddToCart = async (productId) => {
        setIsAddingToCart(productId);
        try {
            const token = authService.getToken();
            if (!token) { alert('Vui lòng đăng nhập!'); return; }

            const resp = await axios.post(`${API}/cart`, { productId, quantity: 1 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.data.success) {
                setMessages(prev => [...prev, { role: 'bot', text: '🎉 Đã thêm vào giỏ hàng! Bạn muốn tiếp tục tìm thêm không?' }]);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Vui lòng đăng nhập!');
        } finally {
            setIsAddingToCart(null);
        }
    };

    // ── Quick search ──────────────────────────────────────────────────
    const fetchRecommend = useCallback(async (query) => {
        if (!query.trim()) return;
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setIsSearching(true);

        try {
            const resp = await axios.post(`${API}/recommend-products`, { text: query }, {
                signal: abortRef.current.signal
            });
            if (resp.data?.products) {
                setSuggestedProducts(resp.data.products);
                setIsAiMode(resp.data.isAiGenerated ?? true);
                if (resp.data.filters) setCurrentEntities(prev => ({ ...prev, ...resp.data.filters }));
            }
        } catch (err) {
            if (!axios.isCancel(err)) console.error('[Quick search]:', err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchRecommend(e.target.value), 400);
    };

    // ── Custom basket selection ────────────────────────────────────────
    const handleSelectProduct = (product) => {
        setCustomBasket(prev => {
            const newProducts = [...prev.products, product];
            const newFlowers = [...new Set([...prev.flowers, ...(product.main_flowers || [])])];
            const newColors = product.dominant_color ? [...new Set([...prev.colors, product.dominant_color])] : prev.colors;
            return { products: newProducts, flowers: newFlowers, colors: newColors, totalPrice: prev.totalPrice + (product.price || 0) };
        });
        setMessages(prev => [...prev, { role: 'bot', text: `✅ Đã thêm "${product.name}" vào giỏ tự chọn!` }]);
    };

    // ── Render entities summary ───────────────────────────────────────
    const renderEntitiesChips = () => {
        const chips = [];
        if (currentEntities.flower_types?.length) chips.push({ label: currentEntities.flower_types.join(', '), color: 'green' });
        if (currentEntities.color?.length) chips.push({ label: Array.isArray(currentEntities.color) ? currentEntities.color.join(', ') : currentEntities.color, color: 'pink' });
        if (currentEntities.occasion) chips.push({ label: currentEntities.occasion, color: 'orange' });
        if (currentEntities.style) chips.push({ label: currentEntities.style, color: 'purple' });
        if (currentEntities.budget) chips.push({ label: formatPrice(currentEntities.budget), color: 'blue' });
        return chips;
    };

    const chips = renderEntitiesChips();
    const hasEntities = chips.length > 0;

    const chipColors = {
        green: 'bg-green-50 text-green-700 border-green-200',
        pink: 'bg-pink-50 text-pink-700 border-pink-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    // ── Classify product badge ────────────────────────────────────────
    const getProductRole = (productId) => {
        const id = String(productId);
        if (classification.main?.some(m => String(m) === id)) return { label: 'Chính', color: 'bg-pink-500 text-white' };
        if (classification.secondary?.some(s => String(s) === id)) return { label: 'Phụ', color: 'bg-purple-400 text-white' };
        return null;
    };

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-pink-100 px-6 py-2 rounded-full shadow-sm mb-4">
                        <Sparkles size={16} className="text-yellow-400" />
                        <span className="text-xs font-semibold text-pink-600 uppercase tracking-widest">AI Thiết Kế Giỏ Hoa</span>
                    </div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent tracking-tight">
                        Hydrangea Studio
                    </h1>
                    <p className="mt-3 text-base text-gray-500 max-w-xl mx-auto">
                        Mô tả giỏ hoa trong mơ — AI sẽ tìm hoa, bố trí layout và render ảnh cho bạn!
                    </p>
                </div>

                {/* Main layout: 3 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── Cột 1: Chat ── */}
                    <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl border border-pink-100 flex flex-col overflow-hidden min-h-[600px]">
                        {/* Chat header */}
                        <div className="p-4 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-fuchsia-50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center shadow-md">
                                <Flower2 size={20} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-gray-800 text-sm">Hydrangea AI</h2>
                                <p className="text-[10px] text-green-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                                    Đang hoạt động
                                </p>
                            </div>
                        </div>

                        {/* Entity chips */}
                        {hasEntities && (
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-1">
                                {chips.map((chip, i) => (
                                    <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${chipColors[chip.color]}`}>
                                        {chip.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-tr-sm shadow-md'
                                            : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-center gap-2">
                                    {[0, 75, 150].map(delay => (
                                        <div key={delay} className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                                    ))}
                                    <span className="text-xs text-gray-400 italic">Đang phân tích...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Gợi ý nhanh */}
                        {messages.length <= 2 && (
                            <div className="px-4 pb-2">
                                <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Gợi ý nhanh:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {['Giỏ hoa hồng đỏ sinh nhật', 'Hoa tím lavender 500k', 'Lẵng hướng dương khai trương'].map((hint, i) => (
                                        <button key={i} onClick={() => setInputText(hint)}
                                            className="text-[10px] bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer">
                                            💬 {hint}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat input */}
                        <div className="p-3 bg-white border-t border-pink-50">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    disabled={isLoading}
                                    placeholder="Mô tả giỏ hoa bạn muốn..."
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-sm px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all disabled:bg-gray-100"
                                />
                                <button type="submit" disabled={!inputText.trim() || isLoading}
                                    className="w-10 h-10 bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 cursor-pointer flex-shrink-0">
                                    <Send size={16} strokeWidth={2.5} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── Cột 2: Ảnh giỏ hoa ── */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {/* Image preview card */}
                        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden flex-1">
                            <div className="p-4 border-b border-pink-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ImageIcon size={16} className="text-pink-500" />
                                    <span className="font-bold text-gray-800 text-sm">Preview Giỏ Hoa</span>
                                </div>
                                {imageGenerated && (
                                    <button onClick={() => setShowImageModal(true)}
                                        className="text-xs text-pink-500 hover:text-pink-600 font-medium cursor-pointer">
                                        Xem to →
                                    </button>
                                )}
                            </div>

                            <div className="relative aspect-square bg-gradient-to-br from-pink-50 to-fuchsia-50 flex items-center justify-center">
                                {imageGenerated && generatedImage ? (
                                    <img src={generatedImage} alt="Generated basket" className="w-full h-full object-contain p-2" />
                                ) : isGeneratingImage ? (
                                    <div className="flex flex-col items-center gap-3 text-center p-6">
                                        <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500 font-medium animate-pulse">Đang cắm hoa...</p>
                                    </div>
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Flower2 size={28} className="text-pink-300" />
                                        </div>
                                        <p className="text-sm text-gray-400">Ảnh giỏ hoa sẽ hiện ở đây</p>
                                        <p className="text-xs text-gray-300 mt-1">Chat với AI để bắt đầu</p>
                                    </div>
                                )}
                            </div>

                            {hasEntities && (
                                <div className="p-4 border-t border-pink-50">
                                    <button
                                        onClick={handleGenerateFromEntities}
                                        disabled={isGeneratingImage}
                                        className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
                                        {isGeneratingImage ? (
                                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang render...</>
                                        ) : (
                                            <><Sparkles size={16} /> Render giỏ hoa từ AI</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>


                        {/* ── AI Bouquet Summary ── */}
                        {bouquetSummary && (
                            <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-yellow-400" />
                                        <h4 className="font-bold text-gray-800 text-sm">Tổng hợp AI</h4>
                                    </div>
                                    {bouquetSummary.total_price > 0 && (
                                        <span className="font-extrabold text-pink-600 text-sm">
                                            {formatPrice(bouquetSummary.total_price)}
                                        </span>
                                    )}
                                </div>
                                {bouquetSummary.explanation && (
                                    <p className="text-[10px] text-gray-500 italic leading-relaxed mb-2 border-l-2 border-pink-200 pl-2">
                                        {bouquetSummary.explanation}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-1">
                                    {(bouquetSummary.items || []).slice(0, 3).map((item, i) => (
                                        <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                            item.role === 'main'
                                                ? 'bg-pink-100 text-pink-700 border-pink-200'
                                                : 'bg-purple-50 text-purple-600 border-purple-200'
                                        }`}>
                                            {item.role === 'main' ? '🌸' : '✿'} {item.name?.substring(0, 16)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manual basket summary */}
                        {customBasket.products.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Package size={14} className="text-pink-500" />
                                        <h4 className="font-bold text-gray-800 text-sm">Tuyển chọn thủ công</h4>
                                    </div>
                                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">
                                        {customBasket.products.length} sản phẩm
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-pink-50">
                                    <span className="text-xs text-gray-500">Tổng:</span>
                                    <span className="font-extrabold text-pink-600">{formatPrice(customBasket.totalPrice)}</span>
                                </div>
                                <button
                                    onClick={() => setCustomBasket({ products: [], flowers: [], colors: [], totalPrice: 0 })}
                                    className="mt-2 w-full text-gray-400 hover:text-gray-600 text-xs py-1 cursor-pointer">
                                    Xóa lựa chọn
                                </button>
                            </div>
                        )}
                    </div>


                    {/* ── Cột 3: Sản phẩm gợi ý ── */}
                    <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl border border-pink-100 flex flex-col overflow-hidden min-h-[600px]">
                        {/* Header */}
                        <div className="p-4 border-b border-pink-50 flex items-center gap-2">
                            <Tag size={16} className="text-pink-500" />
                            <h3 className="font-bold text-gray-800 text-sm flex-1">
                                {isAiMode ? '✨ Gợi ý phù hợp nhất' : '🔥 Sản phẩm nổi bật'}
                            </h3>
                            {suggestedProducts.length > 0 && (
                                <span className="text-[10px] text-gray-400">{suggestedProducts.length} kết quả</span>
                            )}
                        </div>

                        {/* Quick search */}
                        <div className="p-3 border-b border-gray-50">
                            <div className="relative">
                                <input type="text"
                                    placeholder="Tìm nhanh mẫu hoa..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm px-4 py-2.5 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-pink-300"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isSearching ? (
                                        <span className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin block" />
                                    ) : (
                                        <Search size={15} className="text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product list */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {suggestedProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                                    <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
                                        <Search size={24} className="text-pink-200" />
                                    </div>
                                    <p className="text-gray-400 text-sm mb-4">Chat với Hydrangea để xem gợi ý nhé!</p>
                                    <div className="space-y-2 w-full max-w-xs">
                                        {['Giỏ hoa hồng đỏ tặng sinh nhật', 'Lẵng hoa sang trọng tone hồng', 'Hộp hoa hướng dương vui vẻ'].map((hint, i) => (
                                            <button key={i}
                                                onClick={() => { setSearchQuery(hint); fetchRecommend(hint); }}
                                                className="w-full text-left text-xs text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-2 rounded-xl border border-pink-100 transition-colors cursor-pointer">
                                                💬 {hint}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                suggestedProducts.map((product, idx) => {
                                    const role = getProductRole(product._id);
                                    return (
                                        <div key={product._id || idx}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                                            <div className="flex">
                                                {/* Image */}
                                                <div className="w-24 h-24 flex-shrink-0 bg-gray-50 relative">
                                                    <img
                                                        src={product.images?.[0]?.url || 'https://via.placeholder.com/96?text=🌸'}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {role && (
                                                        <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${role.color}`}>
                                                            {role.label}
                                                        </span>
                                                    )}
                                                    {idx === 0 && (
                                                        <span className="absolute top-1 right-1 text-[9px] bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded-full">
                                                            #1
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-xs leading-tight line-clamp-2">{product.name}</h4>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {product.dominant_color && (
                                                                <span className="text-[9px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-full border border-pink-100">{product.dominant_color}</span>
                                                            )}
                                                            {product.main_flowers?.slice(0, 1).map((f, i) => (
                                                                <span key={i} className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full border border-green-100">{f}</span>
                                                            ))}
                                                            {product.aiScore > 0 && (
                                                                <span className="text-[9px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-100 flex items-center gap-0.5">
                                                                    <Star size={8} fill="currentColor" />{product.aiScore}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-2 gap-1">
                                                        <div>
                                                            <p className="text-pink-600 font-extrabold text-sm">{formatPrice(product.price)}</p>
                                                            {product.originalPrice > product.price && (
                                                                <p className="text-gray-400 text-[10px] line-through">{formatPrice(product.originalPrice)}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleSelectProduct(product)}
                                                                className="text-[9px] border border-pink-400 text-pink-500 hover:bg-pink-50 px-2 py-1 rounded-full cursor-pointer transition-colors">
                                                                Chọn
                                                            </button>
                                                            <button onClick={() => handleGenerateFromProduct(product._id)}
                                                                disabled={isGeneratingImage}
                                                                className="text-[9px] bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded-full cursor-pointer transition-colors disabled:opacity-50">
                                                                <ImageIcon size={9} className="inline" />
                                                            </button>
                                                            <button onClick={() => handleAddToCart(product._id)}
                                                                disabled={isAddingToCart === product._id}
                                                                className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors">
                                                                {isAddingToCart === product._id ? (
                                                                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                                                ) : <ShoppingCart size={10} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Image Modal ── */}
            {showImageModal && generatedImage && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full relative">
                        <button onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center z-10 cursor-pointer">
                            ✕
                        </button>
                        <img src={generatedImage} alt="Generated basket" className="w-full object-contain" />
                        <div className="p-5 bg-white border-t">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-800">Giỏ hoa AI tạo</span>
                                {customBasket.totalPrice > 0 && (
                                    <span className="text-pink-600 font-extrabold text-lg">{formatPrice(customBasket.totalPrice)}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setShowImageModal(false); handleGenerateFromEntities(); }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer">
                                    <RefreshCw size={14} /> Tạo lại
                                </button>
                                <button onClick={() => setShowImageModal(false)}
                                    className="flex-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-sm py-2.5 rounded-xl font-bold cursor-pointer">
                                    Tiếp tục
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Global render loading overlay ── */}
            {isGeneratingImage && !showImageModal && (
                <div className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl border border-pink-100 p-4 flex items-center gap-3">
                    <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">Đang render...</p>
                        <p className="text-xs text-gray-400">Cắm hoa đẹp cần vài giây</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HydrangeaStudio;