const { materialTypes } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllMaterialTypes = catchAsync(async (req, res) => {
  const types = await db.select().from(materialTypes);
  res.status(200).json({
    status: 'success',
    results: types.length,
    data: { materialTypes: types }
  });
});

exports.getMaterialType = catchAsync(async (req, res, next) => {
  const type = await db
    .select()
    .from(materialTypes)
    .where(eq(materialTypes.id, req.params.id))
    .limit(1);
  
  if (!type.length) {
    return next(new AppError('No material type found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { materialType: type[0] }
  });
});

exports.createMaterialType = catchAsync(async (req, res) => {
  const newType = await db
    .insert(materialTypes)
    .values(req.body)
    .returning();
  
  res.status(201).json({
    status: 'success',
    data: { materialType: newType[0] }
  });
});

exports.updateMaterialType = catchAsync(async (req, res, next) => {
  const type = await db
    .update(materialTypes)
    .set(req.body)
    .where(eq(materialTypes.id, req.params.id))
    .returning();

  if (!type.length) {
    return next(new AppError('No material type found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { materialType: type[0] }
  });
});

exports.deleteMaterialType = catchAsync(async (req, res, next) => {
  const type = await db
    .delete(materialTypes)
    .where(eq(materialTypes.id, req.params.id))
    .returning();

  if (!type.length) {
    return next(new AppError('No material type found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
