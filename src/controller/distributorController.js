const { distributors } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllDistributors = catchAsync(async (req, res) => {
  const distributorsList = await db.select().from(distributors);

  res.status(200).json({
    status: 'success',
    results: distributorsList.length,
    data: { distributors: distributorsList }
  });
});

exports.getDistributor = catchAsync(async (req, res, next) => {
  const distributor = await db.select()
    .from(distributors)
    .where(eq(distributors.id, req.params.id))
    .limit(1);
  
  if (!distributor.length) {
    return next(new AppError('No distributor found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { distributor: distributor[0] }
  });
});

exports.createDistributor = catchAsync(async (req, res, next) => {
  const { name, address, phoneNumber, phoneNumber2, phoneNumber3, email } = req.body;

  // Validate required fields
  if (!name) {
    return next(new AppError('Distributor name is required', 400));
  }

  const newDistributor = await db.insert(distributors).values({
    name,
    address,
    phoneNumber,
    phoneNumber2,
    phoneNumber3,
    email
  }).returning();

  res.status(201).json({
    status: 'success',
    data: { distributor: newDistributor[0] }
  });
});

exports.updateDistributor = catchAsync(async (req, res, next) => {
  const distributor = await db.select()
    .from(distributors)
    .where(eq(distributors.id, req.params.id))
    .limit(1);
  
  if (!distributor.length) {
    return next(new AppError('No distributor found with that ID', 404));
  }

  const updatedDistributor = await db.update(distributors)
    .set({
      ...req.body,
    })
    .where(eq(distributors.id, req.params.id))
    .returning();

  res.status(200).json({
    status: 'success',
    data: { distributor: updatedDistributor[0] }
  });
});

exports.deleteDistributor = catchAsync(async (req, res, next) => {
  const distributor = await db.select()
    .from(distributors)
    .where(eq(distributors.id, req.params.id))
    .limit(1);
  
  if (!distributor.length) {
    return next(new AppError('No distributor found with that ID', 404));
  }

  await db.delete(distributors)
    .where(eq(distributors.id, req.params.id));

  res.status(204).json({
    status: 'success',
    data: null
  });
});
