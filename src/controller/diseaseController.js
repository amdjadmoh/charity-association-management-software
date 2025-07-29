const { disease } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllDiseases = catchAsync(async (req, res) => {
  const diseases = await db.select().from(disease);
  res.status(200).json({
    status: 'success',
    results: diseases.length,
    data: { diseases }
  });
});

exports.getDisease = catchAsync(async (req, res, next) => {
  const diseaseData = await db.select().from(disease).where(eq(disease.id, req.params.id)).limit(1);
  
  if (!diseaseData.length) {
    return next(new AppError('No disease found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { disease: diseaseData[0] }
  });
});

exports.createDisease = catchAsync(async (req, res) => {
  const newDisease = await db.insert(disease).values(req.body).returning();
  
  res.status(201).json({
    status: 'success',
    data: { disease: newDisease[0] }
  });
});

exports.updateDisease = catchAsync(async (req, res, next) => {
  const updatedDisease = await db.update(disease)
    .set(req.body)
    .where(eq(disease.id, req.params.id))
    .returning();

  if (!updatedDisease.length) {
    return next(new AppError('No disease found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { disease: updatedDisease[0] }
  });
});

exports.deleteDisease = catchAsync(async (req, res, next) => {
  const deletedDisease = await db.delete(disease)
    .where(eq(disease.id, req.params.id))
    .returning();

  if (!deletedDisease.length) {
    return next(new AppError('No disease found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
