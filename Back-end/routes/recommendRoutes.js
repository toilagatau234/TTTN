const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');

/**
 * Route for Product Recommendation
 * POST /api/recommend
 */
router.post('/', recommendController.recommendProducts);

module.exports = router;
