const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

/**
 * Route for automated Image Generation
 * POST /api/generate-image
 */
router.post('/', imageController.generateProductImage);

module.exports = router;
