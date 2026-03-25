// Back-end/services/promptBuilder.js

// Từ điển mapping từ Tiếng Việt sang Tiếng Anh để tối ưu Prompt
const flowerMap = {
    'hoa hồng': 'roses',
    'hoa cúc': 'daisies',
    'hoa hướng dương': 'sunflowers',
    'hoa lan': 'orchids',
    'hoa cẩm chướng': 'carnations',
    'hoa baby': 'baby\'s breath',
    'hoa ly': 'lilies',
    'hoa tulip': 'tulips',
    'hoa mẫu đơn': 'peonies',
    'hoa cẩm tú cầu': 'hydrangeas'
};

const colorMap = {
    'đỏ': 'red',
    'trắng': 'white',
    'hồng': 'pink',
    'vàng': 'yellow',
    'tím': 'purple',
    'xanh lam': 'blue',
    'xanh lá': 'green',
    'cam': 'orange',
    'cam đào': 'peach',
    'pastel': 'soft pastel'
};

exports.buildPrompt = (entities) => {
    // 1. Ánh xạ dữ liệu
    const rawFlower = entities.flower ? entities.flower.toLowerCase() : '';
    const rawColor = entities.color ? entities.color.toLowerCase() : '';

    // Lọc key tương đối (ví dụ user nhập "hoa hồng phấn", nếu không có exact match thì fallback tùy biến)
    let flower = 'mixed beautiful premium flowers';
    for (const [key, val] of Object.entries(flowerMap)) {
        if (rawFlower.includes(key)) {
            flower = val;
            break;
        }
    }

    let color = 'vibrant and elegant';
    for (const [key, val] of Object.entries(colorMap)) {
        if (rawColor.includes(key)) {
            color = val;
            break;
        }
    }

    // 2. Xây dựng Prompt tiếng Anh tối ưu hóa cho Midjourney/Gemini
    const prompt = `A breathtaking, hyper-realistic 3D render of an elegant flower bouquet featuring premium ${flower}. The color palette consists of visually stunning ${color} tones. 
Professional studio lighting, soft natural shadows, highly detailed textures, exquisite and luxury wrapping paper matching the floral colors. 
Shot on 85mm lens, depth of field, 8k resolution, suitable for a highly premium luxury e-commerce catalog.`;

    return prompt;
};
