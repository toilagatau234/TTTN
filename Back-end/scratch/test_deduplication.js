const { normalizeString } = require('../utils/normalizer');

const mergeEntities = (session, newEntities) => {
    if (!newEntities) return;
    const sessionEntities = session.entities;

    const newFlowers = [
        ...(newEntities.flower_types || []),
        ...(newEntities.flowers || []),
        ...(newEntities.flower_type ? [newEntities.flower_type] : [])
    ].filter(Boolean);

    if (newFlowers.length > 0) {
        sessionEntities.flower_types = Array.from(new Set(newFlowers));
        
        if (newEntities.structured_flowers) {
            const uniqueSF = [];
            const seenSF = new Set();
            newEntities.structured_flowers.forEach(sf => {
                const key = `${normalizeString(sf.type)}|${normalizeString(sf.color || '')}`;
                if (!seenSF.has(key)) {
                    seenSF.add(key);
                    uniqueSF.push(sf);
                }
            });
            sessionEntities.structured_flowers = uniqueSF;
        }
    }
};

const session = { entities: { flower_types: [], structured_flowers: [] } };
const newEntities = {
    flower_types: ["Lan Hồ Điệp", "Lan hồ điệp"],
    structured_flowers: [
        { type: "Lan Hồ Điệp", color: "Đen" },
        { type: "lan ho diep", color: "den" }
    ]
};

mergeEntities(session, newEntities);
console.log(JSON.stringify(session.entities, null, 2));
