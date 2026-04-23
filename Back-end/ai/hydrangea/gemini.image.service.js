/**
 * Back-end/ai/hydrangea/gemini.image.service.js v2
 *
 * Luồng tạo ảnh:
 * 1. Dùng Gemini (gemini-2.5-flash) để tạo prompt ảnh chi tiết, bám sát items thật
 * 2. Gọi Pollinations AI (free, không cần key) để render ảnh từ prompt
 *
 * Lý do: Gemini image gen yêu cầu paid plan (Imagen 4),
 * responseModalities:IMAGE không được hỗ trợ free tier.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const http = require('http');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ── Bước 1: Gemini tạo prompt ảnh chi tiết ───────────────────────────────────
async function buildDetailedPromptWithGemini(entities, selectedItems) {
    if (!GEMINI_API_KEY) {
        return buildFallbackPrompt(entities, selectedItems);
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const inputSummary = [
            selectedItems.basket?.name && `Giỏ/lẵng: ${selectedItems.basket.name}`,
            selectedItems.wrapper?.name && `Giấy gói: ${selectedItems.wrapper.name}`,
            selectedItems.ribbon?.name && `Ruy băng: ${selectedItems.ribbon.name}`,
            selectedItems.main_flowers?.length && `Hoa chính: ${selectedItems.main_flowers.map(f => f.name).join(', ')}`,
            selectedItems.sub_flowers?.length && `Hoa phụ: ${selectedItems.sub_flowers.map(f => f.name).join(', ')}`,
            selectedItems.accessories?.length && `Phụ kiện: ${selectedItems.accessories.map(a => a.name).join(', ')}`,
            entities.colors?.length && `Tông màu: ${entities.colors.join(', ')}`,
            entities.occasion && `Dịp: ${entities.occasion}`,
            entities.style && `Phong cách: ${entities.style}`,
        ].filter(Boolean).join('\n');

        const metaPrompt = `You are an expert florist and photographer. 
Based on the following flower basket specification, write a detailed, vivid English image generation prompt (max 120 words) for creating a realistic, professional product photo of this flower arrangement.
The prompt must describe: flowers, colors, container/basket, wrapping, composition, lighting, background.

Specification:
${inputSummary}

Write ONLY the image prompt, no explanations.`;

        const result = await model.generateContent(metaPrompt);
        const geminiPrompt = result.response.text().trim();
        console.log('[Gemini] Generated prompt:', geminiPrompt.substring(0, 150));
        return geminiPrompt;
    } catch (err) {
        console.warn('[Gemini] Prompt generation failed, using fallback:', err.message);
        return buildFallbackPrompt(entities, selectedItems);
    }
}

// ── Fallback prompt nếu Gemini fail ──────────────────────────────────────────
function buildFallbackPrompt(entities, selectedItems) {
    const parts = ['beautiful professional flower basket arrangement'];

    const mainFlowers = selectedItems.main_flowers?.map(f => f.name).filter(Boolean);
    if (mainFlowers?.length) parts.push(`with ${mainFlowers.join(' and ')}`);
    else if (entities.flower_types?.length) parts.push(`with ${entities.flower_types.join(' and ')}`);

    const subFlowers = selectedItems.sub_flowers?.map(f => f.name).filter(Boolean);
    if (subFlowers?.length) parts.push(`accented with ${subFlowers.join(', ')}`);

    if (entities.colors?.length) parts.push(`in ${entities.colors.join(' and ')} color tones`);
    if (selectedItems.wrapper?.name) parts.push(`wrapped in ${selectedItems.wrapper.name}`);
    if (selectedItems.ribbon?.name) parts.push(`with ${selectedItems.ribbon.name} ribbon`);
    if (entities.occasion) parts.push(`for ${entities.occasion}`);

    parts.push('professional florist photography, white background, high quality, sharp focus, product photo');
    return parts.join(', ');
}

// ── Bước 2: Pollinations AI tạo ảnh ─────────────────────────────────────────
function fetchImageAsBase64(imageUrl) {
    return new Promise((resolve, reject) => {
        const protocol = imageUrl.startsWith('https') ? https : http;
        protocol.get(imageUrl, { timeout: 45000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchImageAsBase64(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
            res.on('error', reject);
        }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    });
}

async function generateWithPollinations(prompt) {
    const encoded = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);
    // model: flux (best quality), turbo (fastest)
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&model=flux&seed=${seed}&nologo=true`;

    console.log('[Pollinations] Requesting image...');
    console.log('[Pollinations] URL:', url.substring(0, 120) + '...');

    const base64 = await fetchImageAsBase64(url);
    console.log('[Pollinations] ✅ Image received, size:', base64.length, 'chars');
    return { success: true, imageBase64: base64, mimeType: 'image/jpeg', modelUsed: 'pollinations-flux' };
}

// ── Main export ───────────────────────────────────────────────────────────────
async function generateBouquetImage(entities, selectedItems) {
    try {
        // Bước 1: Gemini tạo prompt chi tiết
        const prompt = await buildDetailedPromptWithGemini(entities, selectedItems);

        // Bước 2: Pollinations render ảnh
        const result = await generateWithPollinations(prompt);
        return { ...result, prompt };

    } catch (err) {
        console.error('[ImageGen] Error:', err.message);
        return {
            success: false,
            error: `Không thể tạo ảnh: ${err.message}. Vui lòng thử lại.`,
        };
    }
}

// ── buildBouquetPrompt (exported for reuse) ───────────────────────────────────
function buildBouquetPrompt(entities, selectedItems) {
    return buildFallbackPrompt(entities, selectedItems);
}

// ── Kiểm tra Gemini key ───────────────────────────────────────────────────────
async function checkGeminiApiKey() {
    if (!GEMINI_API_KEY) return { valid: false, error: 'Key not configured' };
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        await model.generateContent('Hi');
        return { valid: true, model: 'gemini-2.5-flash', imageProvider: 'pollinations.ai (free)' };
    } catch (err) {
        return { valid: false, error: err.message?.substring(0, 100) };
    }
}

module.exports = { generateBouquetImage, buildBouquetPrompt, checkGeminiApiKey };
