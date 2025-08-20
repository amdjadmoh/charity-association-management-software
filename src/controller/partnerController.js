const { partner } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllPartners = catchAsync(async (req, res) => {
  const partnersList = await db.select().from(partner);

  res.status(200).json({
    status: 'success',
    results: partnersList.length,
    data: { partners: partnersList }
  });
});

exports.getPartner = catchAsync(async (req, res, next) => {
  const partnerData = await db.select()
    .from(partner)
    .where(eq(partner.id, req.params.id))
    .limit(1);
  
  if (!partnerData.length) {
    return next(new AppError('No partner found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { partner: partnerData[0] }
  });
});

exports.createPartner = catchAsync(async (req, res, next) => {
  const { name, address, type, phoneNumber, phoneNumber2, phoneNumber3, email } = req.body;

  // Validate required fields
  if (!name) {
    return next(new AppError('Partner name is required', 400));
  }
  
  if (!type) {
    return next(new AppError('Partner type is required', 400));
  }

  const newPartner = await db.insert(partner).values({
    name,
    address,
    type,
    phoneNumber,
    phoneNumber2,
    phoneNumber3,
    email
  }).returning();

  res.status(201).json({
    status: 'success',
    data: { partner: newPartner[0] }
  });
});

exports.updatePartner = catchAsync(async (req, res, next) => {
  const partnerData = await db.select()
    .from(partner)
    .where(eq(partner.id, req.params.id))
    .limit(1);
  
  if (!partnerData.length) {
    return next(new AppError('No partner found with that ID', 404));
  }

  const updatedPartner = await db.update(partner)
    .set({
      ...req.body,
    })
    .where(eq(partner.id, req.params.id))
    .returning();

  res.status(200).json({
    status: 'success',
    data: { partner: updatedPartner[0] }
  });
});

