const { stock, stockDistribution, patient,Donation,products } = require('../db/schema');
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
  const product= await db.select()
    .from(products)
    .where(eq(products.id, req.body.productId))
    .limit(1);
  if (!product.length) {
    return next(new AppError('No product found with that ID', 404));
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

  // update product
  await db.update(products)
    .set({ quantity: product[0].quantity + req.body.quantity })
    .where(eq(products.id, req.body.productId));

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
  const oldStock = await db.select()
    .from(stock)
    .where(eq(stock.id, req.params.id))
    .limit(1);
  if (!oldStock.length) {
    return next(new AppError('No stock item found with that ID', 404));
  }

  const oldQuantity = oldStock[0].quantity;
// get donations 

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
  // update product
  await db.update(products)
    .set({ quantity: product[0].quantity + (req.body.quantity - oldQuantity) })
    .where(eq(products.id, req.body.productId));

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

  // update product
  await db.update(products)
    .set({ quantity: product[0].quantity + (0 - oldQuantity) })
    .where(eq(products.id, req.body.productId));

  res.status(204).json({
    status: 'success',
    data: null
  });
});



