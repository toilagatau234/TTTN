const express = require('express');
const bannerController = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/active', bannerController.getActiveBanners);
router.get('/', protect, authorize('Admin', 'Manager'), bannerController.getAllBanners);
router.get('/:id', protect, authorize('Admin', 'Manager'), bannerController.getBanner);
router.post('/', protect, authorize('Admin', 'Manager'), bannerController.createBanner);
router.put('/:id', protect, authorize('Admin', 'Manager'), bannerController.updateBanner);
router.delete('/:id', protect, authorize('Admin', 'Manager'), bannerController.deleteBanner);

module.exports = router;
