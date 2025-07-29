const { Donor } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllDonors = catchAsync(async (req, res) => {
  const donors = await db.select().from(Donor);
  res.status(200).json({
    status: 'success',
    results: donors.length,
    data: { donors }
  });
});

exports.getDonor = catchAsync(async (req, res, next) => {
  const donor = await db.select().from(Donor).where(eq(Donor.id, req.params.id)).limit(1);
  
  if (!donor.length) {
    return next(new AppError('No donor found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { donor: donor[0] }
  });
});

exports.createDonor = catchAsync(async (req, res) => {
  const newDonor = await db.insert(Donor).values(req.body).returning();
  
  res.status(201).json({
    status: 'success',
    data: { donor: newDonor[0] }
  });
});

exports.updateDonor = catchAsync(async (req, res, next) => {
  const donor = await db.update(Donor)
    .set(req.body)
    .where(eq(Donor.id, req.params.id))
    .returning();

  if (!donor.length) {
    return next(new AppError('No donor found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { donor: donor[0] }
  });
});

exports.deleteDonor = catchAsync(async (req, res, next) => {
  const donor = await db.delete(Donor)
    .where(eq(Donor.id, req.params.id))
    .returning();

  if (!donor.length) {
    return next(new AppError('No donor found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
