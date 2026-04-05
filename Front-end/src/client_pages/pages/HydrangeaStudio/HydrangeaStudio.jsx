import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Image as ImageIcon, Sparkles, CheckCircle, RefreshCcw, ShoppingCart } from 'lucide-react';
import authService from '../../../services/authService';

const HydrangeaStudio = () => {
    // ---- State ----
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Chào mừng bạn đến với Studio Thiết Kế của Rosee! Tớ là Hydrangea 🌸. Bạn muốn thiết kế giỏ hoa tông màu gì, và bạn thích loại hoa nào nhất?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false); 

    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentEntities, setCurrentEntities] = useState({});
    const [showConfirmBtn, setShowConfirmBtn] = useState(false);
    const [summaryData, setSummaryData] = useState(null); // Lưu thông tin báo giá tạm tính
    const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 9)}`);  

    const chatEndRef = useRef(null);

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    // ---- Handlers ----
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading || isGeneratingImage) return;

        const userMsg = { role: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/api/ai/hydrangea/chat', {
                sessionId: sessionId,
                message: userMsg.text
            });

            const { success, reply, extractedEntities } = response.data;

            if (success) {
                setMessages(prev => [...prev, { role: 'bot', text: reply }]);
                if (extractedEntities) {
                    setCurrentEntities(prev => ({ ...prev, ...extractedEntities })); 
                }

                // Nếu Backend yêu cầu confirm (đã đủ thông tin để ghép kho)
                if (response.data.status === 'confirm_needed' || reply.toLowerCase().includes("xác nhận") || reply.toLowerCase().includes("đồng ý")) {
                    setShowConfirmBtn(true);
                    if (response.data.summary) {
                        setSummaryData({
                            summary: response.data.summary,
                            tempTotal: response.data.tempTotal
                        });
                    }
                } else {
                    setShowConfirmBtn(false);
                    setSummaryData(null);
                }
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: 'Có lỗi xảy ra, mong bạn thử lại sau.' }]);
            }
        } catch (error) {
            console.error("Hydrangea API Error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: 'Máy chủ đang bảo trì, bạn thông cảm nhé!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDesign = async () => {
        setShowConfirmBtn(false);
        setIsGeneratingImage(true);
        setMessages(prev => [...prev, { role: 'user', text: '(Click) Tôi xác nhận bản phác thảo này!' }]);
        setMessages(prev => [...prev, { role: 'bot', text: 'Đang kết nối tới Họa sĩ AI Gemini để vẽ tác phẩm của bạn. Vui lòng đợi trong giây lát... 🎨' }]);

        try {
            const response = await axios.post('http://localhost:8080/api/ai/hydrangea/chat', {
                sessionId: sessionId,
                isConfirming: true,
                entities: currentEntities // Gửi kèm entities để Gemini vẽ
            });

            const { success, reply, image } = response.data;
            if (success) {
                setMessages(prev => [...prev, { role: 'bot', text: reply }]);
                if (image) {
                    setGeneratedImage(image);
                }
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: 'Rất tiếc, quá trình vẽ tác phẩm bị lỗi.' }]);
            }
        } catch (error) {
            console.error("Gemini Image API Error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: 'Lỗi kết nối bộ sinh ảnh, bạn vui lòng thử lại sau.' }]);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // Hàm gọi API thêm vào giỏ hàng
    const handleAddToCart = async () => {
        setIsAddingToCart(true);
        try {
            // Lấy token từ authService để đảm bảo an toàn
            const token = authService.getToken(); 
            
            const response = await axios.post('http://localhost:8080/api/cart/custom-add', {
                entities: currentEntities,
                imageUrl: generatedImage
            }, {
                headers: { Authorization: `Bearer ${token}` } // Thêm token xác thực
            });

            if (response.data.success) {
                alert(`🎉 Thêm thành công! Giỏ hoa dự kiến giá: ${response.data.data.price.toLocaleString()} VNĐ`);
                // Chuyển hướng tới trang giỏ hàng
                window.location.href = '/cart'; // Hoặc dùng navigate từ react-router-dom nếu có
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Hàm reset để vẽ lại
    const handleReset = () => {
        setGeneratedImage(null);
        setShowConfirmBtn(true); // Cho phép nút hiển thị lại để user xem summary/vẽ lại
        setMessages(prev => [...prev, { role: 'bot', text: 'Bạn muốn thay đổi chi tiết nào so với bản cũ nhỉ? Hãy nói cho mình biết nhé!' }]);
    };

    // Helper hiển thị Entities
    const renderEntitiesInfo = () => {
        const parts = [];
        if (currentEntities.flower) parts.push(`Hoa: ${currentEntities.flower}`);
        if (currentEntities.color) parts.push(`Màu: ${currentEntities.color}`);
        if (currentEntities.occasion) parts.push(`Dịp: ${currentEntities.occasion}`);
        
        if (parts.length === 0) return 'Đang chờ thông tin...';
        return `Đã nhận diện: ${parts.join(' | ')}`;
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
                        Mô tả giỏ hoa trong mơ của bạn, AI của Rosee sẽ lựa hoa thật từ kho và vẽ bản phác thảo 3D dành riêng cho bạn!
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

                            {/* Bảng giá (Summary Card) */}
                            {showConfirmBtn && !isGeneratingImage && !generatedImage && summaryData && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] rounded-2xl p-5 bg-white border border-pink-200 shadow-md ml-0 flex flex-col gap-3">
                                        <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                                            <ShoppingCart size={16} className="text-pink-500" /> Bảng Giá Tạm Tính
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            {summaryData.summary.map((item, i) => (
                                                <div key={i} className="flex justify-between gap-4">
                                                    <span>{item.qty}x {item.item}</span>
                                                    <span className="font-medium">{item.totalPrice.toLocaleString()}đ</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between border-t border-pink-100 pt-3 font-bold text-pink-600 text-base">
                                            <span>Tổng cộng:</span>
                                            <span>{summaryData.tempTotal.toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Nút Confirm */}
                            {showConfirmBtn && !isGeneratingImage && !generatedImage && (
                                <div className="flex justify-start pt-2">
                                    <button
                                        onClick={handleConfirmDesign}
                                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-lg font-semibold tracking-wide transition-all transform hover:-translate-y-1 flex items-center gap-2 animate-bounce cursor-pointer"
                                    >
                                        <CheckCircle size={18} /> Chốt Thiết Kế & Vẽ Mẫu 🎨
                                    </button>
                                </div>
                            )}

                            {/* Loading State */}
                            {(isLoading || isGeneratingImage) && (
                                <div className="flex justify-start items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-pink-300 animate-bounce"></div>
                                    <div className="w-2 h-2 rounded-full bg-pink-300 animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 rounded-full bg-pink-300 animate-bounce delay-150"></div>
                                    <span className="text-xs text-gray-400 ml-2 italic">
                                        {isGeneratingImage ? "Đang render ảnh 8K..." : "Đang bóc tách yêu cầu..."}
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
                                    disabled={isLoading || isGeneratingImage}
                                    placeholder="Một giỏ hoa hồng phấn lãng mạn cỡ 500k..."
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-6 py-4 rounded-full pr-16 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all shadow-inner disabled:bg-gray-100"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isLoading || isGeneratingImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-full flex justify-center items-center shadow transition-colors"
                                >
                                    <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Cột 2: Right Panel (Image Preview & Checkout) */}
                    <div className="w-full lg:w-1/2 bg-pink-50/20 p-8 flex flex-col items-center justify-center relative min-h-[600px]">
                        {/* Decorative background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                            <svg className="absolute left-[10%] top-[10%] w-64 h-64 text-pink-300 transform -rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        </div>

                        {generatedImage ? (
                            <div className="relative z-10 w-full max-w-sm mx-auto transition-all duration-500 ease-in-out">
                                <div className="bg-white p-4 pb-6 rounded-2xl shadow-2xl border border-pink-100">
                                    <div className="rounded-xl overflow-hidden shadow-inner bg-gray-100 aspect-square relative group">
                                        <img src={generatedImage} alt="Generative Bouquet" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                                            <Sparkles size={10} className="text-yellow-300"/> AI Generated
                                        </div>
                                    </div>
                                    <div className="mt-6 text-center">
                                        <h3 className="font-bold text-gray-800 text-xl font-serif italic">Exclusive Custom Bouquet</h3>
                                        <p className="text-pink-500 font-medium mt-1">Sản phẩm độc bản của riêng bạn</p>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <button 
                                            onClick={handleAddToCart}
                                            disabled={isAddingToCart}
                                            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                                        >
                                            {isAddingToCart ? (
                                                <RefreshCcw size={20} className="animate-spin" />
                                            ) : (
                                                <ShoppingCart size={20} className="group-hover:-translate-y-1 transition-transform" />
                                            )}
                                            {isAddingToCart ? 'Đang xử lý...' : 'Dùng hoa thật làm giỏ này ngay'}
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            disabled={isAddingToCart}
                                            className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCcw size={18} /> Chỉnh sửa / Vẽ lại
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : isGeneratingImage ? (
                            <div className="relative z-10 w-full max-w-sm mx-auto transition-all duration-500 ease-in-out">
                                <div className="bg-white p-4 pb-6 rounded-2xl shadow-2xl border border-pink-100 animate-pulse">
                                    <div className="rounded-xl overflow-hidden shadow-inner bg-pink-50 aspect-square relative flex items-center justify-center">
                                        <Sparkles className="text-pink-300 w-16 h-16 animate-spin-slow" />
                                    </div>
                                    <div className="mt-6 space-y-3">
                                        <div className="h-5 bg-pink-100 rounded w-3/4 mx-auto"></div>
                                        <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto"></div>
                                    </div>
                                    <div className="mt-8 space-y-3">
                                        <div className="h-12 bg-pink-100 rounded-xl w-full"></div>
                                        <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 text-center flex flex-col items-center max-w-sm px-6">
                                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-pink-300 mb-6 border border-pink-50 transition-transform hover:scale-110">
                                    <ImageIcon size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Bức Tranh Chưa Hoàn Thiện</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">
                                    Hãy trò chuyện với Hydrangea ở bên tay trái để mường tượng ra tác phẩm của bạn. Bức ảnh từ AI sẽ xuất hiện tại đây khi bạn chốt ý tưởng!
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HydrangeaStudio;