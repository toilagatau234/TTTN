import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Sparkles, ShoppingCart, Star, Search } from 'lucide-react';
import authService from '../../../services/authService';

const HydrangeaStudio = () => {
    // ---- State ----
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Chào mừng bạn đến với Studio Thiết Kế của Rosee! Tớ là Hydrangea 🌸. Bạn muốn tìm giỏ hoa tông màu gì, hay dành tặng ai nhỉ?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(null); // productId đang add

    const [currentEntities, setCurrentEntities] = useState({});
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 9)}`);

    const chatEndRef = useRef(null);

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    // ---- Handlers ----
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const userMsg = { role: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/api/ai/hydrangea/chat', {
                sessionId: sessionId,
                message: userMsg.text
            });

            const { success, reply, extractedEntities, suggestedProducts: products } = response.data;

            if (success) {
                setMessages(prev => [...prev, { role: 'bot', text: reply }]);

                if (extractedEntities) {
                    setCurrentEntities(prev => ({ ...prev, ...extractedEntities }));
                }

                // Nếu Backend trả về sản phẩm gợi ý
                if (products && products.length > 0) {
                    setSuggestedProducts(products);
                }
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: reply || 'Có lỗi xảy ra, mong bạn thử lại sau.' }]);
            }
        } catch (error) {
            console.error("Hydrangea API Error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: 'Máy chủ đang bảo trì, bạn thông cảm nhé!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm thêm sản phẩm thật vào giỏ hàng
    const handleAddToCart = async (productId) => {
        setIsAddingToCart(productId);
        try {
            const token = authService.getToken();
            if (!token) {
                alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
                return;
            }

            const response = await axios.post('http://localhost:8080/api/cart', {
                productId: productId,
                quantity: 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setMessages(prev => [...prev, {
                    role: 'bot',
                    text: '🎉 Đã thêm sản phẩm vào giỏ hàng thành công! Bạn có thể tiếp tục tìm thêm hoặc vào giỏ hàng để thanh toán.'
                }]);
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            const errMsg = error.response?.data?.message || "Vui lòng đăng nhập để thêm vào giỏ hàng!";
            alert(errMsg);
        } finally {
            setIsAddingToCart(null);
        }
    };

    // Helper hiển thị Entities
    const renderEntitiesInfo = () => {
        const parts = [];
        if (currentEntities.flower_type) parts.push(`Hoa: ${currentEntities.flower_type}`);
        if (currentEntities.color) parts.push(`Màu: ${currentEntities.color}`);
        if (currentEntities.occasion) parts.push(`Dịp: ${currentEntities.occasion}`);
        if (currentEntities.style) parts.push(`Style: ${currentEntities.style}`);
        if (currentEntities.layout) parts.push(`Kiểu: ${currentEntities.layout}`);

        if (parts.length === 0) return 'Đang chờ thông tin...';
        return parts.join(' • ');
    };

    // Format giá VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Tiêu đề & Giới thiệu */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-pink-600 tracking-tight flex items-center justify-center gap-2">
                        <Sparkles className="text-yellow-400" /> Hydrangea Studio <Sparkles className="text-yellow-400" />
                    </h1>
                    <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
                        Mô tả giỏ hoa trong mơ của bạn, AI của Rosee sẽ tìm kiếm những mẫu hoa phù hợp nhất từ kho hàng thật!
                    </p>
                </div>

                {/* Main Dashboard Layout */}
                <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100">

                    {/* Cột 1: Chat Interface */}
                    <div className="w-full lg:w-1/2 flex flex-col border-r border-pink-50 min-h-[600px] h-[70vh]">
                        {/* Chat Header */}
                        <div className="p-5 border-b border-pink-50 bg-pink-50/30 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border border-pink-200">
                                <img src="/logo-rosee.png" alt="Hydrangea AI" className="w-full h-full object-cover p-1" onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=AI&background=EC4899&color=fff"; }} />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800">Trợ Lý Hydrangea</h2>
                                <p className="text-xs text-green-500 font-medium tracking-wide flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                                    {renderEntitiesInfo()}
                                </p>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${msg.role === 'user'
                                        ? 'bg-pink-500 text-white rounded-tr-sm shadow-md'
                                        : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm'
                                        }`}>
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Loading State */}
                            {isLoading && (
                                <div className="flex justify-start items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-pink-300 animate-bounce"></div>
                                    <div className="w-2 h-2 rounded-full bg-pink-300 animate-bounce" style={{ animationDelay: '75ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-pink-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <span className="text-xs text-gray-400 ml-2 italic">
                                        Đang phân tích yêu cầu...
                                    </span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 bg-white border-t border-pink-50">
                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                <input
                                    type="text"
                                    disabled={isLoading}
                                    placeholder="Tôi muốn giỏ hoa hồng đỏ tặng sinh nhật..."
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-6 py-4 rounded-full pr-16 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all shadow-inner disabled:bg-gray-100"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-full flex justify-center items-center shadow transition-colors cursor-pointer"
                                >
                                    <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Cột 2: Right Panel - Gợi ý sản phẩm */}
                    <div className="w-full lg:w-1/2 bg-pink-50/20 p-6 flex flex-col relative min-h-[600px] overflow-y-auto">
                        {/* Decorative background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                            <svg className="absolute left-[10%] top-[10%] w-64 h-64 text-pink-300 transform -rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        </div>

                        {suggestedProducts.length > 0 ? (
                            <div className="relative z-10">
                                {/* Tiêu đề gợi ý */}
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                                        <Sparkles size={16} className="text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">Gợi Ý Dành Riêng Cho Bạn</h3>
                                </div>

                                {/* Product Cards */}
                                <div className="space-y-5">
                                    {suggestedProducts.map((product, idx) => (
                                        <div
                                            key={product._id || idx}
                                            className="bg-white rounded-2xl shadow-md border border-pink-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                            style={{ animationDelay: `${idx * 150}ms` }}
                                        >
                                            <div className="flex">
                                                {/* Product Image */}
                                                <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                                                    <img
                                                        src={product.images?.[0]?.url || 'https://via.placeholder.com/200x200?text=Hoa'}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                                    />
                                                    {/* Score Badge */}
                                                    {product.aiScore > 0 && (
                                                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                                                            <Star size={10} fill="currentColor" /> {product.aiScore} điểm
                                                        </div>
                                                    )}
                                                    {/* Ranking Badge */}
                                                    {idx === 0 && (
                                                        <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow">
                                                            #1 Phù hợp nhất
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 p-4 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">
                                                            {product.name}
                                                        </h4>
                                                        {/* Tags */}
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {product.dominant_color && (
                                                                <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-200">
                                                                    {product.dominant_color}
                                                                </span>
                                                            )}
                                                            {product.layout && (
                                                                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200">
                                                                    {product.layout}
                                                                </span>
                                                            )}
                                                            {product.main_flowers?.slice(0, 2).map((f, i) => (
                                                                <span key={i} className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-200">
                                                                    {f}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end justify-between mt-3">
                                                        <div>
                                                            <p className="text-pink-600 font-extrabold text-lg">
                                                                {formatPrice(product.price)}
                                                            </p>
                                                            {product.originalPrice && product.originalPrice > product.price && (
                                                                <p className="text-gray-400 text-xs line-through">
                                                                    {formatPrice(product.originalPrice)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddToCart(product._id)}
                                                            disabled={isAddingToCart === product._id}
                                                            className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            {isAddingToCart === product._id ? (
                                                                <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                                            ) : (
                                                                <ShoppingCart size={14} />
                                                            )}
                                                            {isAddingToCart === product._id ? 'Đang thêm...' : 'Thêm giỏ'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Gợi ý tiếp tục */}
                                <p className="text-center text-xs text-gray-400 mt-6 italic">
                                    Nhắn thêm yêu cầu để mình tìm chính xác hơn nhé! 🌸
                                </p>
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-pink-300 mb-6 border border-pink-50 transition-transform hover:scale-110">
                                    <Search size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Khám Phá Sắc Hoa</h3>
                                <p className="text-gray-500 leading-relaxed text-sm max-w-xs">
                                    Hãy trò chuyện với Hydrangea ở bên trái để mình tìm ra những mẫu hoa phù hợp nhất với mong muốn của bạn!
                                </p>
                                {/* Gợi ý nhanh */}
                                <div className="mt-8 space-y-2 w-full max-w-xs">
                                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Thử hỏi:</p>
                                    {['Giỏ hoa hồng đỏ tặng sinh nhật', 'Lẵng hoa sang trọng tone hồng', 'Hộp hoa hướng dương vui vẻ'].map((hint, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInputText(hint)}
                                            className="w-full text-left text-sm text-pink-600 bg-pink-50 hover:bg-pink-100 px-4 py-2.5 rounded-xl border border-pink-100 transition-colors cursor-pointer"
                                        >
                                            💬 {hint}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HydrangeaStudio;