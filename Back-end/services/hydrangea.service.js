const axios = require('axios');
const geminiService = require('./gemini.service');
const Product = require('../models/Product');

// Quản lý session hội thoại (Trong thực tế nên dùng Redis, đồ án dùng Map() là ổn)
const sessions = new Map();

class HydrangeaService {
    
    async processChat(sessionId, message, isConfirming, incomingEntities) {
        
        // 1. Nếu user bấm nút "Xác Nhận Thiết Kế & Vẽ Mẫu"
        if (isConfirming) {
            try {
                const imageUrl = await geminiService.generateFlowerImage(incomingEntities);
                return {
                    success: true,
                    reply: "Tác phẩm của bạn đã hoàn thành! Bạn thấy sao?",
                    image: imageUrl
                };
            } catch (error) {
                console.error("Gemini Error:", error);
                throw new Error("Lỗi khi vẽ ảnh Gemini");
            }
        }

        // 2. Nếu là tin nhắn chat bình thường
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                flowers: [],  // Mảng: [{ name: 'hoa lan', qty: 5 }, { name: 'hoa rum', qty: 5 }]
                color: null,
                occasion: null
            });
        }
        const session = sessions.get(sessionId);

        // ====== GỌI NER ======
        let extractedEntities = {};
        try {
            const nerResponse = await axios.post('http://localhost:8000/api/hydrangea/extract', { text: message });
            const rawEntities = nerResponse.data.entities || {};
            extractedEntities = Object.fromEntries(
                Object.entries(rawEntities).map(([k, v]) => [k.toLowerCase(), v])
            );
        } catch (error) {
            console.warn("Python AI Service chưa bật, dùng fallback Regex...");
            if (message.toLowerCase().includes('hồng')) extractedEntities.flower = 'Hoa hồng';
            if (message.toLowerCase().includes('đỏ')) extractedEntities.color = 'Đỏ';
            if (message.toLowerCase().includes('sinh nhật')) extractedEntities.occasion = 'Sinh nhật';
        }

        // ====== LỌC RÁC NER (loại bỏ giá trị chứa @@ hoặc rỗng) ======
        for (const key of Object.keys(extractedEntities)) {
            const val = extractedEntities[key];
            if (typeof val === 'string' && (val.includes('@@') || val.trim() === '')) {
                delete extractedEntities[key];
            }
        }

        // ====== XỬ LÝ HOA + SỐ LƯỢNG: TÁCH TỪ MESSAGE GỐC ======
        const msgLower = message.toLowerCase();
        const isAdditive = /thêm|nữa/i.test(message);

        // Bước A: Tìm các cặp [số + hoa tên] từ message gốc
        // Dùng cách đơn giản: split message bằng "và/kết hợp/cùng với" rồi parse từng phần
        let parsedFlowers = [];

        // Tách câu thành các đoạn bằng từ nối
        const segments = msgLower
            .replace(/kết hợp với/g, '||')
            .replace(/kết hợp/g, '||')
            .replace(/cùng với/g, '||')
            .replace(/ và /g, '||')
            .split('||')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const seg of segments) {
            // Tìm pattern: số + (bông/cành)? + hoa + tên
            const m1 = seg.match(/(\d+)\s*(?:bông|cành|bó|nhành|đóa)?\s*(hoa\s+\S+)/i);
            if (m1) {
                parsedFlowers.push({ name: m1[2].trim(), qty: parseInt(m1[1], 10) });
                continue;
            }
            // Tìm pattern: hoa + tên + số + (bông)?
            const m2 = seg.match(/(hoa\s+\S+)\s+(\d+)\s*(?:bông|cành|bó|nhành|đóa)?/i);
            if (m2) {
                parsedFlowers.push({ name: m2[1].trim(), qty: parseInt(m2[2], 10) });
                continue;
            }
            // Chỉ có tên hoa, không có số
            const m3 = seg.match(/(hoa\s+\S+)/i);
            if (m3) {
                parsedFlowers.push({ name: m3[1].trim(), qty: null });
            }
        }

        // Nếu không parse được gì từ message, fallback dùng NER entity
        if (parsedFlowers.length === 0 && extractedEntities.flower) {
            const flowerVal = extractedEntities.flower.trim();
            if (!(flowerVal.toLowerCase() === 'hoa' && session.flowers.length > 0)) {
                parsedFlowers.push({ name: flowerVal, qty: null });
            }
        }

        // Global qty: khi user chỉ nói "5 bông" mà không kèm tên hoa
        let globalQty = null;
        const globalQtyMatch = message.match(/(\d+)\s*(bông|cành|bó|nhành|củ|đóa)/i);
        if (globalQtyMatch) {
            globalQty = parseInt(globalQtyMatch[1], 10);
        }

        console.log(`[Hydrangea] Parsed flowers:`, parsedFlowers, `| globalQty: ${globalQty}`);

        // ====== CẬP NHẬT SESSION FLOWERS ======
        if (parsedFlowers.length > 0) {
            for (const pf of parsedFlowers) {
                const qty = pf.qty || globalQty || 10;
                const existingIdx = session.flowers.findIndex(
                    f => f.name.toLowerCase() === pf.name.toLowerCase()
                );

                if (existingIdx >= 0) {
                    if (isAdditive) {
                        session.flowers[existingIdx].qty += qty;
                        console.log(`[Hydrangea] Cộng dồn ${pf.name}: +${qty} => ${session.flowers[existingIdx].qty}`);
                    } else {
                        session.flowers[existingIdx].qty = qty;
                        console.log(`[Hydrangea] Đặt lại ${pf.name}: ${qty}`);
                    }
                } else {
                    session.flowers.push({ name: pf.name, qty: qty });
                    console.log(`[Hydrangea] Thêm hoa mới: ${pf.name} x${qty}`);
                }
            }
        } else if (globalQty && session.flowers.length > 0) {
            // User chỉ nói qty mà không nói tên hoa => áp dụng đều cho tất cả
            for (const f of session.flowers) {
                if (isAdditive) {
                    f.qty += globalQty;
                } else {
                    f.qty = globalQty;
                }
            }
            console.log(`[Hydrangea] Cập nhật qty toàn bộ:`, session.flowers);
        }

        // Cập nhật color, occasion
        if (extractedEntities.color) session.color = extractedEntities.color;
        if (extractedEntities.occasion) session.occasion = extractedEntities.occasion;

        console.log(`[Hydrangea] Session ${sessionId}:`, JSON.stringify(session));

        // ====== DIALOG MANAGER ======
        let reply = "";
        let isReadyToDraw = false;
        const hasFlower = session.flowers.length > 0;
        const hasColor = !!session.color;

        if (!hasFlower && !hasColor) {
            reply = "Bạn thích loài hoa nào và tông màu chủ đạo là gì nhỉ?";
        } else if (!hasFlower) {
            reply = `Tông màu ${session.color} rất đẹp! Vậy bạn muốn dùng loài hoa chính nào? (VD: hoa hồng, hướng dương...)`;
        } else if (!hasColor) {
            const flowerNames = session.flowers.map(f => f.name).join(', ');
            reply = `Giỏ ${flowerNames} thì tuyệt vời. Bạn muốn phối theo tông màu gì? (VD: đỏ, pastel, trắng...)`;
        } else {
            isReadyToDraw = true;
        }

        console.log(`[Hydrangea] isReadyToDraw: ${isReadyToDraw}`);

        // ====== BƯỚC 2: KIỂM TRA KHO & BÁO GIÁ ======
        let summary = [];
        let tempTotal = 0;
        let status = "continue";

        if (isReadyToDraw) {
            let missingFlowers = [];
            let outOfStockFlowers = [];
            let validProducts = [];

            for (const flowerItem of session.flowers) {
                const fRegex = new RegExp(flowerItem.name, 'i');
                const matchingProducts = await Product.find({ name: { $regex: fRegex } }).limit(1);

                if (matchingProducts.length === 0) {
                    missingFlowers.push(flowerItem.name);
                } else if (matchingProducts[0].stock < flowerItem.qty) {
                    outOfStockFlowers.push({ name: matchingProducts[0].name, stock: matchingProducts[0].stock, requested: flowerItem.qty });
                } else {
                    validProducts.push({ product: matchingProducts[0], qty: flowerItem.qty });
                }
            }

            if (missingFlowers.length > 0) {
                isReadyToDraw = false;
                reply = `Rất xin lỗi bạn 😔, kho nguyên liệu của Rosee hiện không có sẵn "${missingFlowers.join(', ')}". Bạn có thể đổi sang loài hoa khác (chẳng hạn: hoa hồng, hướng dương, cúc họa mi...) được không ạ?`;
                session.flowers = session.flowers.filter(f => !missingFlowers.includes(f.name));
            } else if (outOfStockFlowers.length > 0) {
                isReadyToDraw = false;
                const oos = outOfStockFlowers[0];
                reply = `Tiếc quá, hiện tại mẫu "${oos.name}" trong kho chỉ còn ${oos.stock} bông, không đủ ${oos.requested} bông bạn yêu cầu 😢. Hãy giảm số lượng hoặc đổi sang loại hoa khác nhé!`;
            } else {
                status = "confirm_needed";
                const totalQty = session.flowers.reduce((sum, f) => sum + f.qty, 0);
                const flowerDetail = validProducts.map(vp => `${vp.qty} ${vp.product.name}`).join(', ');
                reply = `Tuyệt vời! Kho đang có sẵn: ${flowerDetail}. Tổng cộng **${totalQty} bông**. Bảng giá bên dưới. Bấm "XÁC NHẬN" nếu bạn muốn AI vẽ phác thảo.`;

                for (const vp of validProducts) {
                    tempTotal += vp.product.price * vp.qty;
                    summary.push({
                        item: vp.product.name,
                        qty: vp.qty,
                        unitPrice: vp.product.price,
                        totalPrice: vp.product.price * vp.qty
                    });
                }

                tempTotal += 50000;
                summary.push({
                    item: 'Giấy gói cao cấp & Phụ kiện',
                    qty: 1,
                    unitPrice: 50000,
                    totalPrice: 50000
                });
            }
        }

        const displayEntities = {
            flower: session.flowers.map(f => `${f.name} (x${f.qty})`).join(', '),
            color: session.color,
            occasion: session.occasion
        };

        return {
            success: true,
            reply: reply,
            extractedEntities: displayEntities,
            isReady: isReadyToDraw,
            status: status,
            summary: summary,
            tempTotal: tempTotal
        };
    }
}

module.exports = new HydrangeaService();