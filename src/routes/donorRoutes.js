const express = require('express');
const donorController = require('../controller/donorController');

const router = express.Router();

router
  .route('/')
  .get(donorController.getAllDonors)
  .post(donorController.createDonor);

  router
  .route('/donations')
  .get(donorController.getAllDonations)
  .post(donorController.createDonation);
  router.route('/notUsedDonations')
  .get(donorController.getNotUsedDonations);
  router
  .route('/donations/:id')
  .get(donorController.getDonation)
  .patch(donorController.updateDonation)
  .delete(donorController.deleteDonation);
router
  .route('/:id')
  .get(donorController.getDonor)
  .patch(donorController.updateDonor)
  .delete(donorController.deleteDonor);
router
  .route('/getDonorDonations/:id')
  .get(donorController.getDonorDonations)

module.exports = router;
