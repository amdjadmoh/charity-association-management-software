const { stock, stockDistribution, patient,Donation } = require('../db/schema');
const { db } = require('../db');
const { eq, lt, and, sql, } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllStock = catchAsync(async (req, res) => {
  const stocks = await db.select()
    .from(stock)
    .where(eq(stock.deleteDate, null));

  res.status(200).json({
    status: 'success',
    results: stocks.length,
    data: { stocks }
  });
});

exports.getStock = catchAsync(async (req, res, next) => {
  const stockItem = await db.select()
    .from(stock)
    .where(and(
      eq(stock.id, req.params.id),
      eq(stock.deleteDate, null)
    ))
    .limit(1);
  
  if (!stockItem.length) {
    return next(new AppError('No stock item found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { stock: stockItem[0] }
  });
});

exports.createStock = catchAsync(async (req, res, next) => {
  // Validate quantity
  if (req.body.quantity < 0) {
    return next(new AppError('Quantity cannot be negative', 400));
  }

  // Validate unit price if provided
  if (req.body.unitPrice && req.body.unitPrice < 0) {
    return next(new AppError('Unit price cannot be negative', 400));
  }

  // calculate price 
  const totalPrice = req.body.unitPrice * req.body.quantity;
  // select donations 
  for(const donation of req.body.donations) {
    const donationExists = await db.select()
      .from(Donation)
        .where(eq(Donation.id, donation.id))
        .limit(1);
    if (!donationExists.length) {
      return next(new AppError(`Donation with ID ${donation.id} not found`,
        404));
    }
    const remainingAmount = donationExists[0].amount - donationExists[0].usedAmount;
    if (Donation.amount > remainingAmount) {
        return next(new AppError(`Donation with ID ${donation.id} does not have enough remaining amount`, 400));
    }
    // update used amount
    await db.update(Donation)
        .set({ usedAmount: donationExists[0].usedAmount + totalPrice })
        .where(eq(Donation.id, donation.id));
    }


  const newStock = await db.insert(stock).values({
    ...req.body,
    deleteDate: null
  }).returning();
  
  res.status(201).json({
    status: 'success',
    data: { stock: newStock[0] }
  });
});

exports.updateStock = catchAsync(async (req, res, next) => {
  // Validate quantity if provided
  if (req.body.quantity !== undefined && req.body.quantity < 0) {
    return next(new AppError('Quantity cannot be negative', 400));
  }

  // 
  if (req.body.unitPrice !== undefined && req.body.unitPrice < 0) {
    return next(new AppError('Unit price cannot be negative', 400));
  }

  const updatedStock = await db.update(stock)
    .set({
      ...req.body,
      updatedAt: new Date()
    })
    .where(and(
      eq(stock.id, req.params.id),
      eq(stock.deleteDate, null)
    ))
    .returning();

  if (!updatedStock.length) {
    return next(new AppError('No stock item found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { stock: updatedStock[0] }
  });
});

exports.deleteStock = catchAsync(async (req, res, next) => {
  // Soft delete by setting deleteDate
  const deletedStock = await db.update(stock)
    .set({ 
      deleteDate: new Date(),
      updatedAt: new Date()
    })
    .where(and(
      eq(stock.id, req.params.id),
      eq(stock.deleteDate, null)
    ))
    .returning();

  if (!deletedStock.length) {
    return next(new AppError('No stock item found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Stock Distribution Controllers
exports.distributeStock = catchAsync(async (req, res, next) => {
  const { patientId, quantity } = req.body;
  const stockId = req.params.id;

  // Check if stock exists and is not deleted
  const stockItem = await db.select()
    .from(stock)
    .where(and(
      eq(stock.id, stockId),
      eq(stock.deleteDate, null)
    ))
    .limit(1);

  if (!stockItem.length) {
    return next(new AppError('No stock item found with that ID', 404));
  }

  // Check if patient exists and is active
  const patientExists = await db.select()
    .from(patient)
    .where(and(
      eq(patient.id, patientId),
      eq(patient.isActive, true),
      eq(patient.isDeceased, false)
    ))
    .limit(1);

  if (!patientExists.length) {
    return next(new AppError('Patient not found or is not active', 404));
  }

  // Check if quantity is available
  if (quantity > stockItem[0].quantity) {
    return next(new AppError('Insufficient stock quantity', 400));
  }

  // Create stock distribution
  await db.transaction(async (tx) => {
    // Create distribution record
    await tx.insert(stockDistribution).values({
      stockId,
      patientId,
      quantity
    });

    // Update stock quantity
    await tx.update(stock)
      .set({ 
        quantity: stockItem[0].quantity - quantity,
        updatedAt: new Date()
      })
      .where(eq(stock.id, stockId));
  });

  res.status(201).json({
    status: 'success',
    message: 'Stock distributed successfully'
  });
});

exports.getStockDistribution = catchAsync(async (req, res) => {
  const distributions = await db.select({
    id: stockDistribution.id,
    quantity: stockDistribution.quantity,
    createdAt: stockDistribution.createdAt,
    stockName: stock.name,
    stockType: stock.type,
    patientFirstName: patient.firstName,
    patientLastName: patient.lastName,
    patientNin: patient.nin
  })
  .from(stockDistribution)
  .leftJoin(stock, eq(stockDistribution.stockId, stock.id))
  .leftJoin(patient, eq(stockDistribution.patientId, patient.id));

  res.status(200).json({
    status: 'success',
    results: distributions.length,
    data: { distributions }
  });
});

// Get low stock items
exports.getLowStock = catchAsync(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  
  const lowStocks = await db.select()
    .from(stock)
    .where(and(
      lt(stock.quantity, threshold),
      eq(stock.deleteDate, null)
    ));

  res.status(200).json({
    status: 'success',
    results: lowStocks.length,
    data: { stocks: lowStocks }
  });
});
