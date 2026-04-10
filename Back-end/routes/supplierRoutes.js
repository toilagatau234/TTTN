const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('Admin', 'Manager'), supplierController.getSuppliers)
  .post(protect, authorize('Admin', 'Manager'), supplierController.createSupplier);

router.route('/:id')
  .get(protect, authorize('Admin', 'Manager'), supplierController.getSupplierById)
  .put(protect, authorize('Admin', 'Manager'), supplierController.updateSupplier)
  .delete(protect, authorize('Admin', 'Manager'), supplierController.deleteSupplier);

module.exports = router;
