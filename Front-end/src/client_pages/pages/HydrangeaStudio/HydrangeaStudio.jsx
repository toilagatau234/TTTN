import React, { useEffect } from 'react';
import { Send, Sparkles, ShoppingCart, RefreshCw, ImageIcon, Flower2, Package, AlertCircle, CheckCircle, Clock, Trash2, Wand2 } from 'lucide-react';
import { useHydrangeaStudio } from './useHydrangeaStudio';

const fmt = p => new Intl.NumberFormat('vi-VN').format(p) + 'đ';

const BOUQUET_TYPE_LABELS = {
    bouquet: '🌸 Bó hoa', basket: '🧺 Giỏ hoa',
    box: '📦 Hộp hoa', vase: '🏺 Bình hoa', stand: '🎋 Kệ hoa',
};

const PROMPT_SUGGESTIONS = [
    'Phong cách lãng mạn', 'Màu pastel nhẹ nhàng',
    'Sang trọng tối giản', 'Tươi sáng rực rỡ',
];

const CATEGORY_LABELS = {
    basket: { label: 'Giỏ / Lẵng', icon: '🧺' },
    wrapper: { label: 'Giấy gói', icon: '🎁' },
    ribbon: { label: 'Ruy băng', icon: '🎀' },
    main_flowers: { label: 'Hoa chính', icon: '🌸' },
    sub_flowers: { label: 'Hoa phụ', icon: '🌿' },
    accessories: { label: 'Phụ kiện', icon: '✨' },
};

// ── Loading Overlay ───────────────────────────────────────────────────────────
function LoadingOverlay() {
    const steps = ['Đang xây dựng prompt...', 'Đang gọi AI tạo ảnh...', 'Đang lưu lên cloud...'];
    return (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl gap-4">
            <div className="w-14 h-14 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            <div className="space-y-2 text-center">
                {steps.map((s, i) => (
                    <p key={i} className={`text-xs flex items-center gap-2 ${i === 1 ? 'text-pink-600 font-bold' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-pink-500 animate-pulse' : 'bg-gray-300'}`} />
                        {s}
                    </p>
                ))}
            </div>
        </div>
    );
}

// ── Error UI ─────────────────────────────────────────────────────────────────
function ErrorPanel({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-sm font-bold text-red-600">Không thể tạo ảnh</p>
            <p className="text-xs text-gray-500">{message}</p>
            <button onClick={onRetry}
                className="mt-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer">
                <RefreshCw size={13} /> Thử lại
            </button>
        </div>
    );
}

// ── Image Grid (2 ảnh) ────────────────────────────────────────────────────────
function ImageGrid({ previewBase64, images, selectedIndex, onSelect }) {
    // FIX v3: Handle both base64 preview and Cloudinary URLs
    const imagesToShow = previewBase64 
        ? [{ url: `data:image/jpeg;base64,${previewBase64}`, public_id: 'preview' }]
        : images || [];
    
    if (!imagesToShow?.length) return null;
    return (
        <div data-testid="image-grid" className={`grid gap-2 p-2 ${imagesToShow.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {imagesToShow.map((img, i) => (
                <button key={img.public_id || i} onClick={() => onSelect(i)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer
                        ${i === selectedIndex ? 'border-pink-500 shadow-lg shadow-pink-100' : 'border-gray-100 hover:border-pink-300'}`}>
                    <img data-testid="generated-image" src={img.url} alt={`Ảnh ${i + 1}`} className="w-full aspect-square object-cover" />
                    {i === selectedIndex && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow">
                            <CheckCircle size={12} className="text-white" />
                        </div>
                    )}
                    <div className={`absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-bold
                        ${i === selectedIndex ? 'bg-pink-500 text-white' : 'bg-black/30 text-white'}`}>
                        {i === selectedIndex ? '✓ Đã chọn' : `Ảnh ${i + 1}`}
                    </div>
                </button>
            ))}
        </div>
    );
}

// ── Items Panel ───────────────────────────────────────────────────────────────
function ItemsPanel({ selectedItems, outOfStockWarnings, totalPrice }) {
    const hasItems = Object.values(selectedItems).some(v => Array.isArray(v) ? v.length > 0 : v !== null);
    if (!hasItems) return (
        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <Flower2 size={28} className="text-pink-200 mb-3" />
            <p className="text-sm text-gray-400">Chat với AI để bắt đầu</p>
            <p className="text-xs text-gray-300 mt-1">Các thành phần giỏ hoa sẽ hiển thị ở đây 🌸</p>
        </div>
    );
    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {outOfStockWarnings?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle size={12} className="text-red-500" />
                        <span className="text-xs font-bold text-red-700">Hết hàng</span>
                    </div>
                    {outOfStockWarnings.map((w, i) => (
                        <p key={i} className="text-xs text-red-600">❌ "{w.item.name}"</p>
                    ))}
                </div>
            )}
            {Object.entries(CATEGORY_LABELS).map(([cat, meta]) => {
                const items = Array.isArray(selectedItems[cat]) ? selectedItems[cat] : (selectedItems[cat] ? [selectedItems[cat]] : []);
                if (!items?.length) return null;
                return (
                    <div key={cat}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{meta.icon} {meta.label}</p>
                        <div className="space-y-1">
                            {items.map(p => (
                                <div key={p._id} className="flex gap-2 items-center p-1.5 bg-pink-50 rounded-lg border border-pink-100">
                                    <img src={p.images?.[0]?.url || 'https://placehold.co/40x40?text=🌸'} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                                        <p className="text-pink-600 font-bold text-xs">{fmt(p.price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {totalPrice > 0 && (
                <div className="sticky bottom-0 bg-white border-t border-pink-100 pt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Tạm tính:</span>
                        <span className="font-extrabold text-pink-600">{fmt(totalPrice)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HydrangeaStudio() {
    const {
        messages, inputText, setInputText, isLoading, chatEndRef,
        entities, suggestedItems, selectedItems, outOfStockWarnings, totalPrice, status,
        previewBase64, generatedImages, selectedImageIndex, isGenerating, generateError, isConfirmingImage,
        promptUsed, detectedType, customPrompt, setCustomPrompt,
        myOrders, isSavingOrder, savedOrder,
        draftImages, showDrafts, setShowDrafts,
        sendMessage, handleGenerate, handleRefine, handleSelectImage,
        handleConfirmImageUpload, handleConfirmOrder, loadMyOrders, startNewChat, resumeChat, deleteHistory,
        loadDraftImages, retryOrderFromDraft, deleteDraftImage,
    } = useHydrangeaStudio();

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);
    useEffect(() => { loadMyOrders(); loadDraftImages(); }, [loadMyOrders, loadDraftImages]);

    const hasEntities = Object.keys(entities).some(k => Array.isArray(entities[k]) ? entities[k].length > 0 : !!entities[k]);
    const canGenerate = hasEntities && suggestedItems && !isGenerating && status !== 'generating';
    const imageReady  = (previewBase64 || generatedImages.length > 0) && (status === 'preview_ready' || status === 'image_ready' || status === 'image_confirmed');

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-pink-100 px-5 py-2 rounded-full shadow-sm mb-3">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">AI Thiết Kế Giỏ Hoa</span>
                    </div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">Hydrangea Studio</h1>
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
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" /> Đang hoạt động
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
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                                    <div className="flex gap-1 items-start truncate">
                                        <span className="font-bold text-gray-500">Hoa:</span>
                                        <span className="text-gray-800 truncate">{entities.flower_types?.length > 0 ? entities.flower_types.join(', ') : 'Không'}</span>
                                    </div>
                                    <div className="flex gap-1 items-start truncate">
                                        <span className="font-bold text-gray-500">Màu:</span>
                                        <span className="text-gray-800 truncate">{entities.colors?.length > 0 ? entities.colors.join(', ') : 'Không'}</span>
                                    </div>
                                    {detectedType && (
                                        <div className="flex gap-1 items-start truncate col-span-2">
                                            <span className="font-bold text-gray-500">Loại:</span>
                                            <span className="text-pink-600 font-bold truncate">{BOUQUET_TYPE_LABELS[detectedType] || detectedType}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} flex-col ${msg.role === 'bot' ? 'items-start' : 'items-end'}`}>
                                    <div className={`max-w-[88%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                                        ${msg.role === 'user' ? 'bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-tr-sm' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
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
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300" />
                                <button type="submit" disabled={!inputText.trim() || isLoading}
                                    className="w-10 h-10 bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-full flex items-center justify-center shadow disabled:opacity-50 cursor-pointer flex-shrink-0">
                                    <Send size={16} strokeWidth={2.5} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Col 2: Preview */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden flex flex-col" style={{ minHeight: 420 }}>
                            <div className="p-4 border-b border-pink-50 flex items-center gap-2">
                                <ImageIcon size={15} className="text-pink-500" />
                                <span className="font-bold text-gray-800 text-sm flex-1">Preview Giỏ Hoa</span>
                                {detectedType && (
                                    <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">
                                        {BOUQUET_TYPE_LABELS[detectedType] || detectedType}
                                    </span>
                                )}
                                {savedOrder && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">✓ {savedOrder.orderCode}</span>
                                )}
                            </div>

                            {/* Image area */}
                            <div className="relative flex-1 bg-gradient-to-br from-pink-50 to-fuchsia-50 min-h-[280px]">
                                {isGenerating && <LoadingOverlay />}
                                {!isGenerating && generateError && (
                                    <ErrorPanel message={generateError} onRetry={() => handleGenerate()} />
                                )}
                                {!isGenerating && !generateError && (previewBase64 || generatedImages.length > 0) && (
                                    <ImageGrid previewBase64={previewBase64} images={generatedImages} selectedIndex={selectedImageIndex} onSelect={handleSelectImage} />
                                )}
                                {!isGenerating && !generateError && !previewBase64 && generatedImages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Flower2 size={28} className="text-pink-300" />
                                        </div>
                                        <p className="text-sm text-gray-400">Ảnh AI sẽ hiện ở đây</p>
                                        <p className="text-xs text-gray-300 mt-1">Chat với AI để bắt đầu</p>
                                    </div>
                                )}
                            </div>

                            {/* Prompt refine */}
                            {imageReady && promptUsed && (
                                <div className="px-3 py-2.5 border-t border-pink-50 bg-gray-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                                        <Wand2 size={10} /> Tinh chỉnh prompt
                                    </p>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {PROMPT_SUGGESTIONS.map((s, i) => (
                                            <button key={i} onClick={() => handleRefine(`${promptUsed}, ${s}`)}
                                                className="text-[10px] bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 px-2 py-0.5 rounded-full cursor-pointer transition-colors">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                                            placeholder="Sửa prompt tiếng Anh..."
                                            className="flex-1 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300" />
                                        <button onClick={() => handleRefine(customPrompt)} disabled={!customPrompt.trim() || isGenerating}
                                            className="bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-full font-bold cursor-pointer transition-colors flex items-center gap-1">
                                            <RefreshCw size={11} /> Tạo lại
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="p-4 border-t border-pink-50">
                                {imageReady ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleGenerate()} disabled={isGenerating}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-3 rounded-2xl font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                                            <RefreshCw size={15} /> Tạo lại
                                        </button>
                                        <button onClick={handleConfirmOrder} disabled={isSavingOrder}
                                            className="flex-[2] bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white text-sm py-3 rounded-2xl font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md">
                                            {isSavingOrder ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart size={16} />}
                                            Đồng ý & Chọn Mua
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => handleGenerate()} disabled={!canGenerate}
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

                        {/* Lịch sử & Nháp */}
                        <div className="bg-white rounded-2xl shadow border border-pink-100 overflow-hidden flex flex-col max-h-[185px]">
                            <div className="flex border-b border-pink-50">
                                <button onClick={() => setShowDrafts(false)} className={`flex-1 py-2 text-xs font-bold transition-colors cursor-pointer ${!showDrafts ? 'text-pink-600 bg-pink-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    <Clock size={12} className="inline mr-1 mb-0.5" /> Lịch sử
                                </button>
                                <button onClick={() => setShowDrafts(true)} className={`flex-1 py-2 text-xs font-bold transition-colors cursor-pointer ${showDrafts ? 'text-pink-600 bg-pink-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    <ImageIcon size={12} className="inline mr-1 mb-0.5" /> Bản nháp ({draftImages.length})
                                </button>
                            </div>
                            <div className="overflow-y-auto">
                                {!showDrafts ? (
                                    myOrders.length === 0
                                        ? <p className="text-xs text-gray-400 text-center py-4">Chưa có lịch sử</p>
                                        : myOrders.map(o => (
                                            <div key={o._id} onClick={() => resumeChat(o._id)}
                                                className="p-3 border-b border-gray-50 flex items-center gap-3 hover:bg-pink-50 cursor-pointer transition-colors group">
                                                {o.generatedImages?.[0]?.url
                                                    ? <img src={o.generatedImages[0].url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                                    : <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center"><Flower2 size={16} className="text-pink-400" /></div>}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-700 group-hover:text-pink-600 truncate">{o.orderCode}</p>
                                                    <p className="text-[10px] text-gray-400 truncate">{o.entities?.flower_types?.join(', ') || 'Giỏ hoa'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-pink-600">{fmt(o.totalPrice)}</p>
                                                    <button onClick={e => { e.stopPropagation(); if (window.confirm('Xóa lịch sử này?')) deleteHistory(o._id); }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    draftImages.length === 0
                                        ? <p className="text-xs text-gray-400 text-center py-4">Chưa có bản nháp nào</p>
                                        : draftImages.map(d => (
                                            <div key={d._id} className="p-3 border-b border-gray-50 flex items-center gap-3 hover:bg-pink-50 transition-colors group">
                                                <img src={d.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-700 truncate">{d.metadata?.prompt || 'Bản nháp thiết kế'}</p>
                                                    <p className="text-[10px] text-gray-400 truncate">{new Date(d.createdAt).toLocaleDateString('vi-VN')} {new Date(d.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => retryOrderFromDraft(d._id)} className="text-[10px] bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white px-2 py-1.5 rounded shadow cursor-pointer font-bold">
                                                        Đặt lại
                                                    </button>
                                                    <button onClick={() => { if (window.confirm('Xóa bản nháp này?')) deleteDraftImage(d._id); }}
                                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Items */}
                    <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl border border-pink-100 flex flex-col overflow-hidden h-[650px]">
                        <div className="p-4 border-b border-pink-50 flex items-center gap-2">
                            <Package size={15} className="text-pink-500" />
                            <h3 className="font-bold text-gray-800 text-sm flex-1">Thành phần giỏ hoa</h3>
                            {totalPrice > 0 && <span className="text-xs font-extrabold text-pink-600">{fmt(totalPrice)}</span>}
                        </div>
                        <ItemsPanel selectedItems={selectedItems} outOfStockWarnings={outOfStockWarnings} totalPrice={totalPrice} />
                    </div>
                </div>
            </div>
        </div>
    );
}