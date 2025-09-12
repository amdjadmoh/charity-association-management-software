const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const AppError = require('../../utils/appError');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../../uploads/patients');
fs.ensureDirSync(uploadDir);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create patient-specific directory
    const patientId = req.params.id;
    const patientDir = path.join(uploadDir, patientId.toString());
    fs.ensureDirSync(patientDir);
    cb(null, patientDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Accept common document types
  const allowedFileTypes = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif',
    // Documents
    '.pdf', '.doc', '.docx', '.txt', '.rtf',
    // Spreadsheets
    '.xls', '.xlsx',
    // Presentations
    '.ppt', '.pptx'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${ext} is not allowed. Allowed file types: ${allowedFileTypes.join(', ')}`, 400), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  }
});

module.exports = upload;
