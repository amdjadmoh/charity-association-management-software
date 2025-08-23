const express = require('express');
const materialLoanController = require('../controller/materialLoanController');

const router = express.Router();

router
  .route('/')
  .get(materialLoanController.getActiveLoans)
  .post(materialLoanController.createMaterialLoan);

router
  .route('/patient/:patientId')
  .get(materialLoanController.getMaterialLoansByPatient);

router
  .route('/material/:materialId')
  .get(materialLoanController.getMaterialLoansByMaterial);

router
  .route('/:id')
  .get(materialLoanController.getMaterialLoan)
  .patch(materialLoanController.updateMaterialLoan)
  .delete(materialLoanController.deleteMaterialLoan);

module.exports = router;
