import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, User, Bot, AlertCircle } from 'lucide-react';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Xin chào! Mình là Iris, trợ lý ảo của Rosee. Mình có thể giúp gì cho bạn?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessage = { role: 'user', text: inputText };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/api/ai/iris/chat', {
                message: userMessage.text
            });

            const { success, message, data } = response.data;

            if (success) {
                setMessages(prev => [...prev, { role: 'bot', text: message, data: data }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, hệ thống đang gặp sự cố. Bạn vui lòng thử lại sau nhé!' }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: 'Mất kết nối tới server. Vui lòng kiểm tra lại mạng hoặc thử lại sau.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Nút bật tắt Widget */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Giao diện Chatbox */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl w-[350px] sm:w-[400px] max-h-[600px] flex flex-col overflow-hidden border border-gray-100 animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-full flex mx-auto items-center justify-center p-1 border-2 border-pink-200">
                                <img src="/logo-rosee.png" alt="Rosee AI" className="w-full h-full object-contain rounded-full" onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Iris&background=FF69B4&color=fff"; }} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Iris - Tiệm Hoa Rosee</h3>
                                <p className="text-xs text-pink-100 flex items-center"><span className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span>Online</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 min-h-[350px] max-h-[400px] space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-2 flex-shrink-0">
                                        <Bot size={18} />
                                    </div>
                                )}

                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.role === 'user' ? 'bg-pink-500 text-white rounded-tr-sm shadow-md' : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100 text-sm leading-relaxed'}`}>
                                    {msg.text}

                                    {/* Hiển thị sản phẩm gợi ý nếu trả về từ Backend RAG */}
                                    {msg.data && msg.data.products && msg.data.products.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gợi ý sản phẩm:</p>
                                            {msg.data.products.map(product => (
                                                <div key={product._id} className="flex items-center p-2 rounded-lg bg-gray-50 hover:bg-pink-50 cursor-pointer transition-colors border border-gray-100">
                                                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-200">
                                                        {/* Mockup image if missing */}
                                                        <img src={product.images && product.images[0] ? product.images[0] : "https://via.placeholder.com/150"} alt={product.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="ml-2 overflow-hidden">
                                                        <p className="text-xs font-medium text-gray-800 truncate">{product.name}</p>
                                                        <p className="text-xs text-pink-600 font-semibold">{product.price?.toLocaleString('vi-VN')} ₫</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start items-end">
                                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-2 flex-shrink-0">
                                    <Bot size={18} />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex space-x-1.5">
                                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Box */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white m-1 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Nhắn tin cho Rosee..."
                                disabled={isLoading}
                                className="flex-1 bg-gray-50 text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-pink-200 transition-all border border-gray-200"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isLoading}
                                className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors flex items-center justify-center flex-shrink-0"
                            >
                                <Send size={18} className={inputText.trim() && !isLoading ? "ml-0.5" : ""} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
