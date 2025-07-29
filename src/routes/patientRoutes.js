const express = require('express');
const patientController = require('../controller/patientController');

const router = express.Router();

router
  .route('/')
  .get(patientController.getAllPatients)
  .post(patientController.createPatient);

router
  .route('/:id')
  .get(patientController.getPatient)
  .patch(patientController.updatePatient)
  .delete(patientController.deletePatient);

module.exports = router;
