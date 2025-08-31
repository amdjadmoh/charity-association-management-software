const express = require('express');
const sackController = require('../controller/sackController');

const router = express.Router();

// Sack routes
router
  .route('/')
  .get(sackController.getAllSacks)
  .post(sackController.createSack);


// Sack Products routes
router
  .route('/:sackId/products')
  .get(sackController.getSackProducts)

// Sack Distribution routes
router
  .route('/:sackId/distribute')
  .post(sackController.distributeSackToPatient);

router
  .route('/distributions/:id')
  .get(sackController.getDistribution);

router
  .route('/distributions/patients/:patientId')
  .get(sackController.getPatientDistributions);

router
  .route('/:sackId/distributions')
  .get(sackController.getSackDistributions);

router
  .route('/:id')
  .get(sackController.getSack)
    .patch(sackController.updateSack)

module.exports = router;
