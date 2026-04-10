const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('Admin', 'Manager'), inventoryController.getInventoryStats);
router.get('/adjustments', protect, authorize('Admin', 'Manager'), inventoryController.getAdjustments);
router.get('/', protect, authorize('Admin', 'Manager'), inventoryController.getImports);
router.get('/:id', protect, authorize('Admin', 'Manager'), inventoryController.getImportDetail);
router.post('/', protect, authorize('Admin', 'Manager'), inventoryController.createImport);
router.post('/adjustments', protect, authorize('Admin', 'Manager'), inventoryController.createStockAdjustment);

module.exports = router;
