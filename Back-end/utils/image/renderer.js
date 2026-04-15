const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

const CANVAS_W = 500;
const CANVAS_H = 500;

/**
 * FlowerRenderer v3 — AI Bouquet System
 * - Canvas: 500x500
 * - Multi-flower support (array of main images)
 * - Dynamic zone positioning (1, 2, ≥3 flowers)
 * - Image cache (in-memory Map per process)
 * - Occasion overlay
 */
class FlowerRenderer {
    constructor() {
        this.layoutPath = path.join(__dirname, 'layouts');
        /** @type {Map<string, import('canvas').Image>} */
        this._imgCache = new Map();
    }

    // ── Layout resolver ─────────────────────────────────────────────────────
    getLayout(style = 'default') {
        const styleMap = {
            'luxury': 'luxury', 'sang trọng': 'luxury', 'elegant': 'luxury', 'tối giản': 'luxury',
            'cute': 'cute', 'dễ thương': 'cute', 'vui': 'cute', 'colorful': 'cute'
        };
        const resolved = styleMap[style?.toLowerCase()] || style || 'default';
        const filePath = path.join(this.layoutPath, `${resolved}.json`);
        const fallback = path.join(this.layoutPath, 'default.json');
        return JSON.parse(fs.readFileSync(fs.existsSync(filePath) ? filePath : fallback, 'utf8'));
    }

    // ── Image loader with cache ─────────────────────────────────────────────
    async loadImageSafe(src) {
        if (!src) return null;
        if (this._imgCache.has(src)) return this._imgCache.get(src);
        try {
            const img = await loadImage(src);
            this._imgCache.set(src, img);
            return img;
        } catch (err) {
            console.warn(`[Renderer] Cannot load: ${src?.substring(0, 60)} — ${err.message}`);
            return null;
        }
    }

    // ── Randomizer ──────────────────────────────────────────────────────────
    jitter(x, y, size, rotation = 0, enabled = true) {
        if (!enabled) return { x, y, size, rotation };
        return {
            x:        x + (Math.random() - 0.5) * 20,
            y:        y + (Math.random() - 0.5) * 20,
            size:     size * (0.9 + Math.random() * 0.2),
            rotation: rotation + (Math.random() - 0.5) * (Math.PI / 9)
        };
    }

    // ── Draw helpers ────────────────────────────────────────────────────────
    async drawAt(ctx, img, x, y, size, rotation = 0, jitterEnabled = true) {
        if (!img) return;
        const r = this.jitter(x, y, size, rotation, jitterEnabled);
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rotation);
        ctx.drawImage(img, -r.size / 2, -r.size / 2, r.size, r.size);
        ctx.restore();
    }

    async drawRect(ctx, img, x, y, w, h) {
        if (!img) return;
        ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    }

    // ── Dynamic main-flower zone positions ─────────────────────────────────
    /**
     * Tính positions chứa mainImages theo số lượng:
     *   1 flower → center
     *   2 flowers → left + right
     *   ≥ 3 flowers → triangle (top-center, bottom-left, bottom-right) + more
     */
    getMainPositions(count) {
        if (count === 1) {
            return [{ x: 250, y: 235, size: 110 }];
        }
        if (count === 2) {
            return [
                { x: 185, y: 250, size: 100 },
                { x: 315, y: 250, size: 100 }
            ];
        }
        // 3+ → triangle + ring
        const positions = [
            { x: 250, y: 195, size: 95 }, // top-center
            { x: 175, y: 280, size: 90 }, // bottom-left
            { x: 325, y: 280, size: 90 }, // bottom-right
        ];
        // Extra flowers scattered
        const extras = [
            { x: 250, y: 300, size: 80 },
            { x: 145, y: 230, size: 75 },
            { x: 355, y: 230, size: 75 },
        ];
        for (let i = 3; i < count; i++) {
            positions.push(extras[i - 3] || { x: 250, y: 250, size: 70 });
        }
        return positions;
    }

    getSecondaryPositions() {
        return [
            { x: 130, y: 260, size: 72 },
            { x: 370, y: 260, size: 72 },
            { x: 160, y: 320, size: 68 },
            { x: 340, y: 320, size: 68 },
        ];
    }

    getLeavesPositions() {
        return [
            { x: 150, y: 285 },
            { x: 350, y: 285 },
            { x: 195, y: 215 },
            { x: 305, y: 215 },
            { x: 250, y: 180 },
        ];
    }

    // ── Main composition function ───────────────────────────────────────────
    /**
     * @param {Object} config
     * @param {string}   config.basketUrl       Basket image URL (transparent)
     * @param {string[]} config.mainUrls         Array of main flower URLs (1–N)
     * @param {string[]} config.secondaryUrls    Array of secondary flower URLs
     * @param {string}   config.leavesUrl        Leaves/greenery URL
     * @param {string}   config.ribbonUrl        Ribbon URL (optional)
     * @param {string}   config.style            'luxury' | 'cute' | 'default'
     * @param {string}   config.occasion         'birthday' | '8_3' | 'wedding' ...
     * @param {boolean}  config.randomize        Enable position jitter (default true)
     * @returns {Promise<Buffer>}
     */
    async generateBasket(config = {}) {
        const {
            basketUrl,
            mainUrls = [],
            secondaryUrls = [],
            leavesUrl,
            ribbonUrl,
            style = 'default',
            occasion,
            randomize = true
        } = config;

        const canvas = createCanvas(CANVAS_W, CANVAS_H);
        const ctx = canvas.getContext('2d');

        // Soft cream background
        ctx.fillStyle = '#FDF8F4';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Pre-load all images in parallel
        const [
            basketImg,
            leavesImg,
            ribbonImg,
            ...flowerImgs
        ] = await Promise.all([
            this.loadImageSafe(basketUrl),
            this.loadImageSafe(leavesUrl),
            this.loadImageSafe(ribbonUrl),
            ...mainUrls.map(u => this.loadImageSafe(u)),
        ]);

        const secondaryImgs = await Promise.all(secondaryUrls.map(u => this.loadImageSafe(u)));

        // ── Layer 0: Basket (bottom zone, z=0) ──────────────────────────────
        if (basketImg) {
            await this.drawRect(ctx, basketImg, 250, 395, 240, 155);
        }

        // ── Layer 1: Leaves (surrounding, z=1) ──────────────────────────────
        if (leavesImg) {
            for (const pos of this.getLeavesPositions()) {
                await this.drawAt(ctx, leavesImg, pos.x, pos.y, 52, 0, randomize);
            }
        }

        // ── Layer 2: Secondary flowers (sides, z=2) ──────────────────────────
        const secPositions = this.getSecondaryPositions();
        for (let i = 0; i < secondaryImgs.length; i++) {
            const pos = secPositions[i % secPositions.length];
            if (pos) await this.drawAt(ctx, secondaryImgs[i], pos.x, pos.y, pos.size, 0, randomize);
        }

        // ── Layer 2: Main flowers (center/dynamic zone, z=2) ─────────────────
        const validMainImgs = flowerImgs.filter(Boolean);
        const mainPositions = this.getMainPositions(validMainImgs.length);
        for (let i = 0; i < validMainImgs.length; i++) {
            const pos = mainPositions[i] || mainPositions[0];
            await this.drawAt(ctx, validMainImgs[i], pos.x, pos.y, pos.size, 0, randomize);
        }

        // ── Layer 3: Ribbon/decoration (top, z=3) ────────────────────────────
        if (ribbonImg) {
            await this.drawAt(ctx, ribbonImg, 250, 115, 110, 0, false);
        }

        // ── Occasion overlay (z=4) ────────────────────────────────────────────
        if (occasion) this.drawOccasionOverlay(ctx, occasion);

        return canvas.toBuffer('image/png');
    }

    // ── Occasion text overlay ───────────────────────────────────────────────
    drawOccasionOverlay(ctx, occasion) {
        const labels = {
            'birthday': '🎂 Happy Birthday',
            'khai_truong': '🎊 Khai Trương',
            'opening': '🎊 Khai Trương',
            '8_3': '🌸 8/3 Hạnh Phúc',
            "women's day": '🌸 Chúc Mừng 8/3',
            'wedding': '💍 Hạnh Phúc Mãi Mãi',
            'anniversary': '💕 Kỷ Niệm',
            'graduation': '🎓 Chúc Mừng Tốt Nghiệp',
        };
        const label = labels[occasion?.toLowerCase()] || labels[occasion];
        if (!label) return;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.90)';
        ctx.fillRect(0, CANVAS_H - 48, CANVAS_W, 48);
        ctx.fillStyle = '#C2185B';
        ctx.font = 'bold 17px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, CANVAS_W / 2, CANVAS_H - 24);
        ctx.restore();
    }
}

module.exports = new FlowerRenderer();
