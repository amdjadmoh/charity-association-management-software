const express = require('express');
const partnerController = require('../controller/partnerController');

const router = express.Router();

// Partner CRUD routes
router
  .route('/')
  .get(partnerController.getAllPartners)
  .post(partnerController.createPartner);

router
  .route('/:id')
  .get(partnerController.getPartner)
  .patch(partnerController.updatePartner)

module.exports = router;
