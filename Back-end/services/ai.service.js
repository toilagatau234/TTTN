const axios = require('axios');

/**
 * AI Service Layer
 * Handles communication with the PhoBERT AI service
 */

/**
 * Valid layout values as per business requirements
 */
const VALID_LAYOUTS = ['round', 'vertical', 'heart'];

/**
 * Analyzes user text using the AI pipeline
 * @param {string} text - User input description
 * @returns {Object} - Standardized { intent, entities }
 */
async function analyzeText(text) {
    try {
        const response = await axios.post('http://localhost:8000/api/hydrangea/analyze', { text });
        
        const { intent, entities } = response.data;

        // ISSUE 1 — INVALID LAYOUT VALUE
        // Normalize layout: if not in valid list -> set to null
        if (entities && entities.layout) {
            const normalizedLayout = entities.layout.toLowerCase();
            if (!VALID_LAYOUTS.includes(normalizedLayout)) {
                entities.layout = null;
            } else {
                entities.layout = normalizedLayout;
            }
        }

        return {
            intent: intent || 'UNKNOWN',
            entities: entities || {}
        };
    } catch (error) {
        console.error('[AI Service] analyzeText Error:', error.message);
        return {
            intent: 'UNKNOWN',
            entities: {}
        };
    }
}

module.exports = {
    analyzeText
};
