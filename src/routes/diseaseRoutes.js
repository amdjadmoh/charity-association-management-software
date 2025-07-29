const express = require('express');
const diseaseController = require('../controller/diseaseController');

const router = express.Router();

router
  .route('/')
  .get(diseaseController.getAllDiseases)
  .post(diseaseController.createDisease);

router
  .route('/:id')
  .get(diseaseController.getDisease)
  .patch(diseaseController.updateDisease)
  .delete(diseaseController.deleteDisease);

module.exports = router;
