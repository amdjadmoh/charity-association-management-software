const express = require('express');
const materialController = require('../controller/materialController');

const router = express.Router();

router
  .route('/')
  .get(materialController.getAllMaterials)
  .post(materialController.createMaterial);

router
  .route('/type/:typeId')
  .get(materialController.getMaterialsByType);

router
  .route('/:id')
  .get(materialController.getMaterial)
  .patch(materialController.updateMaterial)
  .delete(materialController.deleteMaterial);

module.exports = router;
