const { receipt, patient, partner } = require('../db/schema');
const { db } = require('../db');
const { eq, desc, sql } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReceipts = catchAsync(async (req, res) => {
  const receipts = await db
    .select({
      ...receipt,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      partnerName: partner.name
    })
    .from(receipt)
    .leftJoin(patient, eq(receipt.patientId, patient.id))
    .leftJoin(partner, eq(receipt.partnerId, partner.id));

  res.status(200).json({
    status: 'success',
    results: receipts.length,
    data: { receipts }
  });
});

exports.getReceipt = catchAsync(async (req, res, next) => {
  const receiptData = await db
    .select({
      ...receipt,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      partnerName: partner.name
    })
    .from(receipt)
    .leftJoin(patient, eq(receipt.patientId, patient.id))
    .leftJoin(partner, eq(receipt.partnerId, partner.id))
    .where(eq(receipt.id, req.params.id))
    .limit(1);
  
  if (!receiptData.length) {
    return next(new AppError('No receipt found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { receipt: receiptData[0] }
  });
});

exports.createReceipt = catchAsync(async (req, res, next) => {
  const { patientId, type, amount, amountCovered, amountByPatient, partnerId } = req.body;
  
  // Check if patient exists
  if (patientId) {
    const patientExists = await db
      .select()
      .from(patient)
      .where(eq(patient.id, patientId))
      .limit(1);
    
    if (!patientExists.length) {
      return next(new AppError('No patient found with that ID', 404));
    }
  } else {
    return next(new AppError('Patient ID is required', 400));
  }
  
  // Check if partner exists if partnerId is provided
  if (partnerId) {
    const partnerExists = await db
      .select()
      .from(partner)
      .where(eq(partner.id, partnerId))
      .limit(1);
    
    if (!partnerExists.length) {
      return next(new AppError('No partner found with that ID', 404));
    }
  }
  
  // Validate required fields
  if (!type) {
    return next(new AppError('Receipt type is required', 400));
  }
  
  // Generate receipt ID with year-id format
  const year = new Date().getFullYear();
  
  // First get all receipts for this year and find the maximum number
  const allYearReceipts = await db
    .select()
    .from(receipt)
    .where(sql`${receipt.receiptId} LIKE ${year + '-%'}`);
  
  // Find the max number by parsing all IDs
  let maxNumber = 0;
  for (const rec of allYearReceipts) {
    const parts = rec.receiptId.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  
  // Create the new ID with the next number
  const receiptId = `${year}-${maxNumber + 1}`;
  
  // Create the receipt with the generated ID
  const newReceipt = await db.insert(receipt).values({
    patientId,
    type,
    amount,
    amountCovered,
    amountByPatient,
    partnerId,
    receiptId
  }).returning();

  res.status(201).json({
    status: 'success',
    data: { receipt: newReceipt[0] }
  });
});

exports.updateReceipt = catchAsync(async (req, res, next) => {
  const receiptData = await db
    .select()
    .from(receipt)
    .where(eq(receipt.id, req.params.id))
    .limit(1);
  
  if (!receiptData.length) {
    return next(new AppError('No receipt found with that ID', 404));
  }
  
  // Check if patient exists if patientId is provided
  if (req.body.patientId) {
    const patientExists = await db
      .select()
      .from(patient)
      .where(eq(patient.id, req.body.patientId))
      .limit(1);
    
    if (!patientExists.length) {
      return next(new AppError('No patient found with that ID', 404));
    }
  }
  
  // Check if partner exists if partnerId is provided
  if (req.body.partnerId) {
    const partnerExists = await db
      .select()
      .from(partner)
      .where(eq(partner.id, req.body.partnerId))
      .limit(1);
    
    if (!partnerExists.length) {
      return next(new AppError('No partner found with that ID', 404));
    }
  }

  // Don't allow updating the receiptId
  delete req.body.receiptId;
  
  const updatedReceipt = await db.update(receipt)
    .set({
      ...req.body,
    })
    .where(eq(receipt.id, req.params.id))
    .returning();

  res.status(200).json({
    status: 'success',
    data: { receipt: updatedReceipt[0] }
  });
});

exports.deleteReceipt = catchAsync(async (req, res, next) => {
  const receiptData = await db
    .select()
    .from(receipt)
    .where(eq(receipt.id, req.params.id))
    .limit(1);
  
  if (!receiptData.length) {
    return next(new AppError('No receipt found with that ID', 404));
  }

  await db.delete(receipt)
    .where(eq(receipt.id, req.params.id));

  res.status(204).json({
    status: 'success',
    data: null
  });
});
