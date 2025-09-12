const express = require('express');
const patientController = require('../controller/patientController');
const patientFileController = require('../controller/patientFileController');
const patientFileUpload = require('../middlewares/fileUpload/patientFileUpload');

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

// File upload routes
router
  .route('/:id/files')
  .get(patientFileController.getPatientFiles)
  .post(
    patientFileUpload.single('file'),
    patientFileController.uploadPatientFile
  );

router
  .route('/:id/files/multiple')
  .post(
    patientFileUpload.array('files', 10), // Allow up to 10 files
    patientFileController.uploadMultiplePatientFiles
  );

router
  .route('/:id/files/:fileId')
  .get(patientFileController.getPatientFile)
  .delete(patientFileController.deletePatientFile);

router
  .route('/:id/files/:fileId/download')
  .get(patientFileController.downloadPatientFile);

module.exports = router;
