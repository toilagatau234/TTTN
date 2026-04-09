const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

/**
 * Renderer engine for flower basket composition
 */
class FlowerRenderer {
    constructor() {
        this.assetsPath = path.join(__dirname, 'assets');
        this.layoutPath = path.join(__dirname, 'layouts');
    }

    /**
     * Loads layout configuration
     */
    getLayout(layoutName = 'default') {
        const filePath = path.join(this.layoutPath, `${layoutName}.json`);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    /**
     * Draws an image with randomization and optional transparency handling
     */
    async drawAsset(ctx, imagePath, x, y, size, rotation = 0, randomize = true) {
        try {
            const img = await loadImage(imagePath);
            
            ctx.save();
            
            // Randomization
            let finalX = x;
            let finalY = y;
            let finalSize = size;
            let finalRotation = rotation;

            if (randomize) {
                finalX += (Math.random() - 0.5) * 20; // ±10px
                finalY += (Math.random() - 0.5) * 20; // ±10px
                finalSize *= (0.9 + Math.random() * 0.2); // 90% - 110%
                finalRotation += (Math.random() - 0.5) * 0.2; // ±0.1 rad
            }

            ctx.translate(finalX, finalY);
            ctx.rotate(finalRotation);
            
            // Draw image centered on position
            ctx.drawImage(img, -finalSize / 2, -finalSize / 2, finalSize, finalSize);
            
            ctx.restore();
        } catch (error) {
            console.error(`[Renderer] Failed to draw asset: ${imagePath}`, error.message);
        }
    }

    /**
     * Main rendering function
     */
    async generateBasket(config) {
        const { mainFlower, subFlower, decoration, layoutName = 'default' } = config;
        const layout = this.getLayout(layoutName);
        
        const canvas = createCanvas(layout.canvas.width, layout.canvas.height);
        const ctx = canvas.getContext('2d');

        // 1. Draw Background (Basket)
        const backgroundPath = path.join(this.assetsPath, 'background', 'basket.png');
        try {
            const bg = await loadImage(backgroundPath);
            ctx.drawImage(bg, 0, 0, layout.canvas.width, layout.canvas.height);
        } catch (e) {
            console.error("[Renderer] Background missing");
            // Fill with some color if background fails
            ctx.fillStyle = '#fdf5e6';
            ctx.fillRect(0, 0, layout.canvas.width, layout.canvas.height);
        }

        // 2. Draw Sub Flowers (Surrounding)
        if (subFlower) {
            const subPath = path.join(this.assetsPath, 'flowers', `${subFlower}.png`);
            for (const pos of layout.sub_positions) {
                await this.drawAsset(ctx, subPath, pos.x, pos.y, layout.sub_flower_size);
            }
        }

        // 3. Draw Main Flowers (Center)
        if (mainFlower) {
            const mainPath = path.join(this.assetsPath, 'flowers', `${mainFlower}.png`);
            for (const pos of layout.main_positions) {
                await this.drawAsset(ctx, mainPath, pos.x, pos.y, layout.main_flower_size);
            }
        }

        // 4. Draw Decorations
        if (decoration) {
            const decoPath = path.join(this.assetsPath, 'decorations', `${decoration}.png`);
            for (const pos of layout.decoration_positions) {
                await this.drawAsset(ctx, decoPath, pos.x, pos.y, layout.decoration_size, pos.rotation || 0, false);
            }
        }

        return canvas.toBuffer('image/png');
    }
}

module.exports = new FlowerRenderer();
