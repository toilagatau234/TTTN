import React, { useEffect } from 'react';
import { Send, Sparkles, ShoppingCart, Star, RefreshCw, ImageIcon, Flower2, Package, AlertCircle, CheckCircle, Clock, ChevronDown, Trash2 } from 'lucide-react';
import { useHydrangeaStudio } from './useHydrangeaStudio';

const fmt = p => new Intl.NumberFormat('vi-VN').format(p) + 'đ';

const CATEGORY_LABELS = {
    basket: { label: 'Giỏ / Lẵng', icon: '🧺', single: true },
    wrapper: { label: 'Giấy gói', icon: '🎁', single: true },
    ribbon: { label: 'Ruy băng', icon: '🎀', single: true },
    main_flowers: { label: 'Hoa chính', icon: '🌸', single: false },
    sub_flowers: { label: 'Hoa phụ', icon: '🌿', single: false },
    accessories: { label: 'Phụ kiện', icon: '✨', single: false },
    complete_bouquets: { label: 'Giỏ hoa hoàn chỉnh', icon: '💐', single: true },
};

function ProductCard({ product, category, isSelected, outOfStock }) {
    return (
        <div
            className={`relative flex gap-2 p-2 rounded-xl border text-left w-full transition-all
                ${outOfStock ? 'opacity-50 border-gray-100 bg-gray-50' :
                isSelected ? 'border-pink-400 bg-pink-50 shadow-md' : 'border-gray-100 bg-white'}`}
        >
            <img
                src={product.images?.[0]?.url || 'https://placehold.co/64x64?text=🌸'}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
                <p className="text-pink-600 font-bold text-xs mt-1">{fmt(product.price)}</p>
                {outOfStock && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Hết hàng</span>}
            </div>
            {isSelected && !outOfStock && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={10} className="text-white" />
                </div>
            )}
        </div>
    );
}

function ItemsPanel({ selectedItems, outOfStockWarnings, totalPrice }) {
    const hasItems = Object.values(selectedItems).some(val => Array.isArray(val) ? val.length > 0 : val !== null);
    if (!hasItems) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-3">
                    <Flower2 size={28} className="text-pink-300" />
                </div>
                <p className="text-sm text-gray-400">Chat với AI để bắt đầu</p>
                <p className="text-xs text-gray-300 mt-1">Các thành phần giỏ hoa sẽ hiển thị ở đây 🌸</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {outOfStockWarnings?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <AlertCircle size={13} className="text-red-500" />
                        <span className="text-xs font-bold text-red-700">Sản phẩm hết hàng</span>
                    </div>
                    {outOfStockWarnings.map((w, i) => (
                        <div key={i} className="mb-2">
                            <p className="text-xs text-red-600">❌ "{w.item.name}" đã hết hàng</p>
                            {w.alternatives?.length > 0 && (
                                <div className="mt-1">
                                    <p className="text-[10px] text-gray-500 mb-1">Gợi ý thay thế:</p>
                                    {w.alternatives.map((alt, j) => (
                                        <p key={j} className="text-[10px] text-green-700 bg-green-50 rounded px-2 py-0.5">✓ {alt.name} — {fmt(alt.price)}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {Object.entries(CATEGORY_LABELS).map(([cat, meta]) => {
                const items = Array.isArray(selectedItems[cat]) ? selectedItems[cat] : (selectedItems[cat] ? [selectedItems[cat]] : []);
                if (!items?.length) return null;
                return (
                    <div key={cat}>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            {meta.icon} {meta.label}
                        </p>
                        <div className="space-y-1.5">
                            {items.map(p => (
                                <ProductCard
                                    key={p._id}
                                    product={p}
                                    category={cat}
                                    isSelected={true}
                                    outOfStock={p.stock === 0}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {totalPrice > 0 && (
                <div className="sticky bottom-0 bg-white border-t border-pink-100 pt-2 pb-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Tạm tính:</span>
                        <span className="font-extrabold text-pink-600">{fmt(totalPrice)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Popup removed as requested

export default function HydrangeaStudio() {
    const {
        messages, inputText, setInputText, isLoading, chatEndRef,
        entities, suggestedItems, selectedItems, outOfStockWarnings, totalPrice, status,
        generatedImage, isGenerating,
        myOrders, showOrders, setShowOrders, isSavingOrder, savedOrder,
        sendMessage, handleGenerate, handleConfirmOrder, loadMyOrders,
        startNewChat, resumeChat, deleteHistory
    } = useHydrangeaStudio();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    useEffect(() => {
        // Tải lịch sử chat khi vừa vào trang
        loadMyOrders();
    }, [loadMyOrders]);

    const hasEntities = Object.keys(entities).some(k => {
        const v = entities[k];
        return Array.isArray(v) ? v.length > 0 : !!v;
    });

    const canGenerate = hasEntities && suggestedItems && !isGenerating && status !== 'image_ready';

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-pink-100 px-5 py-2 rounded-full shadow-sm mb-3">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">AI Thiết Kế Giỏ Hoa</span>
                    </div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                        Hydrangea Studio
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">Mô tả giỏ hoa trong mơ — AI chọn hoa, tạo ảnh và lưu đơn cho bạn!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Col 1: Chat */}
                    <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl border border-pink-100 flex flex-col overflow-hidden h-[650px]">
                        <div className="p-4 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-fuchsia-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center shadow">
                                    <Flower2 size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Hydrangea AI</p>
                                    <p className="text-[10px] text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                                        Đang hoạt động
                                    </p>
                                </div>
                            </div>
                            <button onClick={startNewChat} className="text-xs bg-white text-pink-600 hover:bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer">
                                <span>+</span> Mới
                            </button>
                        </div>

                        {/* Entity chips */}
                        {hasEntities && (
                            <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                                    <div className="flex gap-1 items-start truncate">
                                        <span className="font-bold text-gray-500">Hoa:</span>
                                        <span className="text-gray-800 truncate">{entities.flower_types?.length > 0 ? entities.flower_types.join(', ') : 'Không'}</span>
                                    </div>
                                    <div className="flex gap-1 items-start truncate">
                                        <span className="font-bold text-gray-500">Màu sắc:</span>
                                        <span className="text-gray-800 truncate">{entities.colors?.length > 0 ? entities.colors.join(', ') : 'Không'}</span>
                                    </div>
                                    <div className="flex gap-1 items-start truncate">
                                        <span className="font-bold text-gray-500">Phụ kiện/Gói:</span>
                                        <span className="text-gray-800 truncate">{[entities.wrapper, ...(entities.accessories || [])].filter(Boolean).join(', ') || 'Không'}</span>
                                    </div>
                                    <div className="flex gap-1 items-start truncate">
                                        <span className="font-bold text-gray-500">Giá:</span>
                                        <span className="text-pink-600 font-bold truncate">{entities.budget > 0 ? fmt(entities.budget) : 'Không'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} flex-col ${msg.role === 'bot' ? 'items-start' : 'items-end'}`}>
                                    <div className={`max-w-[88%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-tr-sm'
                                        : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                    {msg.quickChips?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5 max-w-[90%]">
                                            {msg.quickChips.map((chip, j) => (
                                                <button key={j} onClick={() => sendMessage(chip)}
                                                    className="text-[10px] bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors">
                                                    💬 {chip}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2">
                                    {[0, 100, 200].map(d => <div key={d} className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                    <span className="text-xs text-gray-400 italic">Đang phân tích...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-pink-50">
                            <form onSubmit={e => { e.preventDefault(); sendMessage(inputText); }} className="flex gap-2">
                                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                                    placeholder="Mô tả giỏ hoa bạn muốn..."
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300"
                                />
                                <button type="submit" disabled={!inputText.trim() || isLoading}
                                    className="w-10 h-10 bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-full flex items-center justify-center shadow disabled:opacity-50 cursor-pointer flex-shrink-0">
                                    <Send size={16} strokeWidth={2.5} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Col 2: Preview & Generate */}
                    <div className="lg:col-span-4 flex flex-col gap-4 h-[650px]">
                        {/* Generated image or placeholder */}
                        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden flex-1">
                            <div className="p-4 border-b border-pink-50 flex items-center gap-2">
                                <ImageIcon size={15} className="text-pink-500" />
                                <span className="font-bold text-gray-800 text-sm flex-1">Preview Giỏ Hoa</span>
                                {savedOrder && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">✓ {savedOrder.orderCode}</span>
                                )}
                            </div>
                            <div className="aspect-square bg-gradient-to-br from-pink-50 to-fuchsia-50 flex items-center justify-center relative">
                                {generatedImage ? (
                                    <img src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
                                        alt="AI Bouquet" className="w-full h-full object-contain p-2" />
                                ) : isGenerating ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500 animate-pulse">Đang tạo ảnh...</p>
                                    </div>
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Flower2 size={28} className="text-pink-300" />
                                        </div>
                                        <p className="text-sm text-gray-400">Ảnh AI sẽ hiện ở đây</p>
                                        <p className="text-xs text-gray-300 mt-1">Chat với AI để bắt đầu</p>
                                    </div>
                                )}
                            </div>
                            {/* Generate button */}
                            <div className="p-4 border-t border-pink-50">
                                {status === 'image_ready' && generatedImage ? (
                                    <div className="flex gap-2">
                                        <button onClick={handleGenerate} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-3 rounded-2xl font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                                            <RefreshCw size={16} /> Tạo lại
                                        </button>
                                        <button onClick={handleConfirmOrder} disabled={isSavingOrder} className="flex-[2] bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white text-sm py-3 rounded-2xl font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md">
                                            {isSavingOrder ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart size={16} />}
                                            Đồng ý & Chọn Mua
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={handleGenerate} disabled={!canGenerate}
                                            className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer">
                                            {isGenerating
                                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang tạo...</>
                                                : <><Sparkles size={16} />✨ Tạo Giỏ Hoa</>}
                                        </button>
                                        {!hasEntities && <p className="text-center text-[10px] text-gray-400 mt-1.5">Chat với AI trước để kích hoạt nút này</p>}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Lịch sử trò chuyện */}
                        <div className="bg-white rounded-2xl shadow border border-pink-100 overflow-hidden flex flex-col max-h-[180px]">
                            <div className="p-3 bg-gray-50 border-b border-pink-50 flex items-center gap-2">
                                <Clock size={14} className="text-pink-500" />
                                <span className="text-sm font-semibold text-gray-700 flex-1">Lịch sử thiết kế gần đây</span>
                            </div>
                            <div className="overflow-y-auto">
                                {myOrders.length === 0
                                    ? <p className="text-xs text-gray-400 text-center py-4">Chưa có lịch sử</p>
                                    : myOrders.map(o => (
                                        <div key={o._id} onClick={() => resumeChat(o._id)} className="p-3 border-b border-gray-50 flex items-center gap-3 hover:bg-pink-50 cursor-pointer transition-colors group">
                                            {o.generatedImage?.url
                                                ? <img src={o.generatedImage.url} className="w-10 h-10 rounded-lg object-cover group-hover:shadow" alt="" />
                                                : <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:shadow"><Flower2 size={16} className="text-pink-400" /></div>}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-700 group-hover:text-pink-600 transition-colors truncate">{o.orderCode}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{o.entities?.flower_types?.join(', ') || 'Giỏ hoa'}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-pink-600">{fmt(o.totalPrice)}</p>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử này?")) {
                                                                deleteHistory(o._id);
                                                            }
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-pink-100 text-pink-600 hover:bg-pink-200">
                                                    Tiếp tục
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Items panel */}
                    <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl border border-pink-100 flex flex-col overflow-hidden h-[650px]">
                        <div className="p-4 border-b border-pink-50 flex items-center gap-2">
                            <Package size={15} className="text-pink-500" />
                            <h3 className="font-bold text-gray-800 text-sm flex-1">Thành phần giỏ hoa</h3>
                            {totalPrice > 0 && <span className="text-xs font-extrabold text-pink-600">{fmt(totalPrice)}</span>}
                        </div>
                        <ItemsPanel
                            selectedItems={selectedItems}
                            outOfStockWarnings={outOfStockWarnings}
                            totalPrice={totalPrice}
                        />
                    </div>
                </div>
            </div>


        </div>
    );
}