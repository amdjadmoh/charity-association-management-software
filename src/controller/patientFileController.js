const path = require('path');
const fs = require('fs-extra');
const { patientFiles } = require('../db/schema');
const { db } = require('../db');
const { eq, desc } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Upload file for a patient
exports.uploadPatientFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const patientId = parseInt(req.params.id);
  const { description, fileCategory } = req.body;
  
  // Create file entry in database
  const fileData = {
    patientId,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileType: path.extname(req.file.originalname).toLowerCase(),
    fileSize: req.file.size,
    filePath: req.file.path.replace(/\\/g, '/'), // Normalize path for database storage
    description: description || null,
    fileCategory: fileCategory || null
  };

  const newFile = await db.insert(patientFiles).values(fileData).returning();

  res.status(201).json({
    status: 'success',
    data: {
      file: newFile[0]
    }
  });
});

// Upload multiple files for a patient
exports.uploadMultiplePatientFiles = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400));
  }

  const patientId = parseInt(req.params.id);
  const { description, fileCategory } = req.body;
  
  // Create file entries in database
  const filePromises = req.files.map(async (file) => {
    const fileData = {
      patientId,
      fileName: file.filename,
      originalName: file.originalname,
      fileType: path.extname(file.originalname).toLowerCase(),
      fileSize: file.size,
      filePath: file.path.replace(/\\/g, '/'), // Normalize path for database storage
      description: description || null,
      fileCategory: fileCategory || null
    };

    return await db.insert(patientFiles).values(fileData).returning();
  });

  const uploadedFiles = await Promise.all(filePromises);
  
  res.status(201).json({
    status: 'success',
    results: uploadedFiles.length,
    data: {
      files: uploadedFiles.map(file => file[0])
    }
  });
});

// Get all files for a patient
exports.getPatientFiles = catchAsync(async (req, res, next) => {
  const patientId = parseInt(req.params.id);
  
  const files = await db
    .select()
    .from(patientFiles)
    .where(eq(patientFiles.patientId, patientId))
    .orderBy(desc(patientFiles.uploadDate));
  
  res.status(200).json({
    status: 'success',
    results: files.length,
    data: {
      files
    }
  });
});

// Get a specific file by ID
exports.getPatientFile = catchAsync(async (req, res, next) => {
  const fileId = parseInt(req.params.fileId);
  
  const file = await db
    .select()
    .from(patientFiles)
    .where(eq(patientFiles.id, fileId))
    .limit(1);
  
  if (!file.length) {
    return next(new AppError('File not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      file: file[0]
    }
  });
});

// Download a specific file
exports.downloadPatientFile = catchAsync(async (req, res, next) => {
  const fileId = parseInt(req.params.fileId);
  
  const file = await db
    .select()
    .from(patientFiles)
    .where(eq(patientFiles.id, fileId))
    .limit(1);
  
  if (!file.length) {
    return next(new AppError('File not found', 404));
  }
  
  const filePath = file[0].filePath;
  
  // Check if file exists on disk
  if (!fs.existsSync(filePath)) {
    return next(new AppError('File not found on server', 404));
  }
  
  res.download(filePath, file[0].originalName);
});

// Delete a file
exports.deletePatientFile = catchAsync(async (req, res, next) => {
  const fileId = parseInt(req.params.fileId);
  
  // Get file details before deletion
  const file = await db
    .select()
    .from(patientFiles)
    .where(eq(patientFiles.id, fileId))
    .limit(1);
  
  if (!file.length) {
    return next(new AppError('File not found', 404));
  }
  
  // Delete from database
  const deletedFile = await db
    .delete(patientFiles)
    .where(eq(patientFiles.id, fileId))
    .returning();
  
  // Delete from disk
  try {
    await fs.unlink(file[0].filePath);
    
    // Clean up empty directory if this was the last file
    const dirPath = path.dirname(file[0].filePath);
    const remainingFiles = await fs.readdir(dirPath);
    if (remainingFiles.length === 0) {
      await fs.rmdir(dirPath);
    }
  } catch (error) {
    console.error('Error deleting file from disk:', error);
    // Continue with the response even if file deletion fails
  }
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});
