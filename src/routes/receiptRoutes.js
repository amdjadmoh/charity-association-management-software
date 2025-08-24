const express = require('express');
const receiptController = require('../controller/receiptController');

const router = express.Router();

// Receipt CRUD routes
router
  .route('/')
  .get(receiptController.getAllReceipts)
  .post(receiptController.createReceipt);
router
  .route('/pay/:id')
  .post(receiptController.payReceipt);

router
  .route('/:id')
  .get(receiptController.getReceipt)
  .patch(receiptController.updateReceipt)
  .delete(receiptController.deleteReceipt);

module.exports = router;
