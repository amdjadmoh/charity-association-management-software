const express = require('express');
const materialTypeController = require('../controller/materialTypeController');

const router = express.Router();

router
  .route('/')
  .get(materialTypeController.getAllMaterialTypes)
  .post(materialTypeController.createMaterialType);

router
  .route('/:id')
  .get(materialTypeController.getMaterialType)
  .patch(materialTypeController.updateMaterialType)
  .delete(materialTypeController.deleteMaterialType);

module.exports = router;
