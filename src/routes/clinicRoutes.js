const express = require('express');
const clinicController = require('../controller/clinicController');

const router = express.Router();

// Clinic CRUD routes
router
  .route('/')
  .get(clinicController.getAllClinics)
  .post(clinicController.createClinic);

router
  .route('/:id')
  .get(clinicController.getClinic)
  .patch(clinicController.updateClinic)
  .delete(clinicController.deleteClinic);

module.exports = router;
