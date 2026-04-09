/**
 * Database & AI Data Normalization Layer
 * Helps map AI-extracted entities to database-specific phrasing.
 */

// Dictionary mapping edge cases and aliases to uniform DB keys
const DICTIONARY = {
    // Flowers
    "baby breath": "baby_breath",
    "baby's breath": "baby_breath",
    "hoa cẩm chướng": "carnation",
    "cúc họa mi": "daisy",
    
    // Colors
    "dark red": "red",
    "light pink": "pink",
    "navy blue": "blue",
    "sky blue": "blue"
};

/**
 * Clean, standard validation for string formatting
 * @param {string} value The raw string
 * @returns {string} Trims, lowercases, and maps to dictionary
 */
const normalizeString = (value) => {
    if (!value || typeof value !== 'string') return '';
    let normalized = value.trim().toLowerCase();
    
    // Map with Dictionary Fallback
    if (DICTIONARY[normalized]) {
        normalized = DICTIONARY[normalized];
    }
    
    return normalized;
};

module.exports = {
    normalizeString
};
