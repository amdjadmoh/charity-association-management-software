const express = require('express');
const supplyRequestController = require('../controller/supplyRequestController');

const router = express.Router();

// Base routes
router
  .route('/')
  .get(supplyRequestController.getAllSupplyRequests)
  .post(supplyRequestController.createSupplyRequest);

// Date range route
router.get('/date-range', supplyRequestController.getSupplyRequestsByDateRange);

// Type specific routes
router.get('/type/:type', supplyRequestController.getSupplyRequestsByType);

// ID specific routes
router
  .route('/:id')
  .get(supplyRequestController.getSupplyRequest)
  .patch(supplyRequestController.updateSupplyRequest)
  .delete(supplyRequestController.deleteSupplyRequest);

module.exports = router;
