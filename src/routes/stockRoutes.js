const express = require('express');
const stockController = require('../controller/stockController');

const router = express.Router();

// Stock CRUD routes
router
  .route('/')
  .get(stockController.getAllStock)
  .post(stockController.createStock);

router
  .route('/:id')
  .get(stockController.getStock)
  .patch(stockController.updateStock)
  .delete(stockController.deleteStock);

// Stock distribution routes
router
  .route('/:id/distribute')
  .post(stockController.distributeStock);

router.get('/distribution/all', stockController.getStockDistribution);

// Additional utility routes
router.get('/low/all', stockController.getLowStock);

module.exports = router;
