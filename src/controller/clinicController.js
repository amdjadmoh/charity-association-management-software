const { clinic } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllClinics = catchAsync(async (req, res) => {
  const clinics = await db.select().from(clinic);

  res.status(200).json({
    status: 'success',
    results: clinics.length,
    data: { clinics }
  });
});

exports.getClinic = catchAsync(async (req, res, next) => {
  const clinicItem = await db.select()
    .from(clinic)
    .where(eq(clinic.id, req.params.id))
    .limit(1);
  
  if (!clinicItem.length) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { clinic: clinicItem[0] }
  });
});

exports.createClinic = catchAsync(async (req, res, next) => {
  const { name, address, phoneNumber, phoneNumber2, phoneNumber3, email } = req.body;

  // Validate required fields
  if (!name) {
    return next(new AppError('Clinic name is required', 400));
  }

  const newClinic = await db.insert(clinic).values({
    name,
    address,
    phoneNumber,
    phoneNumber2,
    phoneNumber3,
    email
  }).returning();

  res.status(201).json({
    status: 'success',
    data: { clinic: newClinic[0] }
  });
});

exports.updateClinic = catchAsync(async (req, res, next) => {
  const clinicItem = await db.select()
    .from(clinic)
    .where(eq(clinic.id, req.params.id))
    .limit(1);
  
  if (!clinicItem.length) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  const updatedClinic = await db.update(clinic)
    .set({
      ...req.body,
    })
    .where(eq(clinic.id, req.params.id))
    .returning();

  res.status(200).json({
    status: 'success',
    data: { clinic: updatedClinic[0] }
  });
});

exports.deleteClinic = catchAsync(async (req, res, next) => {
  const clinicItem = await db.select()
    .from(clinic)
    .where(eq(clinic.id, req.params.id))
    .limit(1);
  
  if (!clinicItem.length) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  await db.delete(clinic)
    .where(eq(clinic.id, req.params.id));

  res.status(204).json({
    status: 'success',
    data: null
  });
});
