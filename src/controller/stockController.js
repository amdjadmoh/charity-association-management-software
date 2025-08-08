const { stock, stockDistribution, patient,Donation,products ,DonationStock} = require('../db/schema');
const { db } = require('../db');
const { eq, lt, and, sql, } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


exports.getAllStock = catchAsync(async (req, res) => {
  const stocks = await db.select()
    .from(stock);

  res.status(200).json({
    status: 'success',
    results: stocks.length,
    data: { stocks }
  });
});

exports.getStock = catchAsync(async (req, res, next) => {
  const stockItem = await db.select()
    .from(stock)
    .where(
      eq(stock.id, req.params.id)
    )
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
  const { quantity, unitPrice, productId, donations } = req.body;

  // Input validation
  if (!Array.isArray(donations)) {
    return next(new AppError('Donations must be an array', 400));
  }

  if (quantity < 0) {
    return next(new AppError('Quantity cannot be negative', 400));
  }

  if (unitPrice && unitPrice < 0) {
    return next(new AppError('Unit price cannot be negative', 400));
  }

  // Start transaction
  const result = await db.transaction(async (tx) => {
    // Check product
    const product = await tx
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product.length) {
      throw new AppError('No product found with that ID', 404);
    }

    // Calculate total price
    const totalPrice = unitPrice * quantity;

    // Validate and collect donation information
    let donationsTotal = 0;
    const donationDetails = [];

    for (const donation of donations) {
      const donationExists = await tx
        .select()
        .from(Donation)
        .where(eq(Donation.id, donation.id))
        .limit(1);

      if (!donationExists.length) {
        throw new AppError(`Donation with ID ${donation.id} not found`, 404);
      }

      const remainingAmount = donationExists[0].amount - donationExists[0].usedAmount;
      donationsTotal += remainingAmount;
      donationDetails.push({ ...donationExists[0], remainingAmount });
    }

    if (totalPrice > donationsTotal) {
      throw new AppError('Total price exceeds available donation amounts', 400);
    }

    // Create stock entry
    const newStock = await tx.insert(stock).values({
      productId,
      quantity,
      unitPrice
    }).returning();

    // Process donations
    let donatedAmount = 0;
    for (const donation of donationDetails) {
      const amount = donatedAmount + donation.remainingAmount >= totalPrice
        ? totalPrice - donatedAmount
        : donation.remainingAmount;

      await tx.insert(DonationStock).values({
        donationId: donation.id,
        stockId: newStock[0].id,
        amount
      });

      await tx.update(Donation)
        .set({ usedAmount: donation.usedAmount + amount })
        .where(eq(Donation.id, donation.id));

      donatedAmount += amount;
      if (donatedAmount >= totalPrice) break;
    }

    // Update product quantity
    await tx.update(products)
      .set({ quantity: product[0].quantity + quantity })
      .where(eq(products.id, productId));

    return newStock[0];
  });

  res.status(201).json({
    status: 'success',
    data: { stock: result }
  });
});
exports.deleteStock = catchAsync(async (req, res, next) => {
  const result = await db.transaction(async (tx) => {
    // Check if stock exists and get its details
    const stockItem = await tx
      .select()
      .from(stock)
      .where(eq(stock.id, req.params.id))
      .limit(1);

    if (!stockItem.length) {
      throw new AppError('No stock item found with that ID', 404);
    }
    // check if quantity has been not used yet
    const product = await tx
      .select()
      .from(products)
      .where(eq(products.id, stockItem[0].productId))
      .limit(1);

    if (!product.length) {
      throw new AppError('No product found with that ID', 404);
    }
    if (product[0].quantity < stockItem[0].quantity) {
      throw new AppError('Cannot delete stock with used quantity', 400);
    }

    // Get related donation stock entries
    const donationStockEntries = await tx
      .select()
      .from(DonationStock)
      .where(eq(DonationStock.stockId, req.params.id));

    // Update product quantity
    await tx
      .update(products)
      .set({
        quantity: sql`${products.quantity} - ${stockItem[0].quantity}`
      })
      .where(eq(products.id, stockItem[0].productId));

    // Update donations used amounts
    for (const entry of donationStockEntries) {
      await tx
        .update(Donation)
        .set({
          usedAmount: sql`${Donation.usedAmount} - ${entry.amount}`
        })
        .where(eq(Donation.id, entry.donationId));
    }

    // Delete donation stock entries
    await tx
      .delete(DonationStock)
      .where(eq(DonationStock.stockId, req.params.id));

    // Delete the stock entry
    const deletedStock = await tx
      .delete(stock)
      .where(eq(stock.id, req.params.id))
      .returning();

    return deletedStock[0];
  });

  res.status(200).json({
    status: 'success',
    data: { stock: result }
  });
});

exports.getStockofProduct = catchAsync(async (req, res, next) => {
  const stockItems = await db
    .select()
    .from(stock)
    .where(eq(stock.productId, req.params.productId));

  if (!stockItems.length) {
    return next(new AppError('No stock found for this product', 404));
  }

  res.status(200).json({
    status: 'success',
    results: stockItems.length,
    data: { stock: stockItems }
  });
});
