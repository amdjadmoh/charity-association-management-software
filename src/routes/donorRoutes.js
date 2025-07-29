const express = require('express');
const donorController = require('../controller/donorController');

const router = express.Router();

router
  .route('/')
  .get(donorController.getAllDonors)
  .post(donorController.createDonor);

router
  .route('/:id')
  .get(donorController.getDonor)
  .patch(donorController.updateDonor)
  .delete(donorController.deleteDonor);

module.exports = router;
