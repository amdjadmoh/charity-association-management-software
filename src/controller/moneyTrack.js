const { Donation, DonationStock, receiptDonations, materialDonations, stock, receipt, Donor, material } = require('../db/schema');
const { db } = require('../db');
const { eq, gt, sql, desc, and, between, gte, lte } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get money track with history of income and expenses
exports.getMoneyTrack = catchAsync(async (req, res) => {
  // 1. Get all donations (income)
  const donations = await db
    .select({
      id: Donation.id,
      amount: Donation.amount,
      date: Donation.date,
      type: Donation.type,
      donorId: Donation.donorId,
      donorName: sql`${Donor.firstName} || ' ' || ${Donor.lastName}`,
      transactionType: sql`'income'::text`,
      description: sql`'Donation'::text`
    })
    .from(Donation)
    .leftJoin(Donor, eq(Donation.donorId, Donor.id));

  // 2. Get all stock purchases linked to donations (expenses)
  const stockExpenses = await db
    .select({
      stockId: stock.id,
      amount: sql`${DonationStock.amount} * -1`, // Negative to indicate expense
      date: DonationStock.createdAt,
      transactionType: sql`'expense'::text`,
      description: sql`'Stock purchase'::text`,
      donationId: DonationStock.donationId
    })
    .from(DonationStock)
    .leftJoin(stock, eq(DonationStock.stockId, stock.id));

  // 3. Get all receipt donations (expenses)
  const receiptExpenses = await db
    .select({
      receiptId: receipt.id,
      amount: sql`${receiptDonations.amount} * -1`, // Negative to indicate expense
      date: receiptDonations.createdAt,
      transactionType: sql`'expense'::text`,
      description: sql`'Receipt coverage'::text`,
      donationId: receiptDonations.donationId
    })
    .from(receiptDonations)
    .leftJoin(receipt, eq(receiptDonations.receiptId, receipt.id));

  // 4. Get all material donations (expenses)
  const materialExpenses = await db
    .select({
      materialId: materialDonations.id,
      amount: sql`${materialDonations.amount} * -1`, // Negative to indicate expense
      date: materialDonations.createdAt,
      transactionType: sql`'expense'::text`,
      description: sql`'Material donation'::text`,
      donationId: materialDonations.donationId
    })
    .from(materialDonations);

  // 5. Combine all transactions and sort by date (chronological order)
  const allTransactions = [...donations, ...stockExpenses, ...receiptExpenses, ...materialExpenses]
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Changed to chronological order

  // 5. Calculate running balance
  let runningBalance = 0;
  const transactionsWithBalance = allTransactions.map(transaction => {
    runningBalance += Number(transaction.amount);
    return {
      ...transaction,
      balance: runningBalance
    };
  });

  // If we want to display most recent transactions first (while maintaining correct balance)
  const reverseTransactions = [...transactionsWithBalance].reverse();

  // Response
  res.status(200).json({
    status: 'success',
    results: transactionsWithBalance.length,
    data: {
      transactions: reverseTransactions, // Using reverse-chronological for display (most recent first)
      totalBalance: runningBalance
    }
  });
});

// Get money track within a specific date range
exports.getMoneyTrackByDateRange = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Validate date parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide both startDate and endDate parameters'
    });
  }
  
  // Parse dates and validate
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid date format. Please use YYYY-MM-DD format'
    });
  }
  
  // Set end date to end of day
  end.setHours(23, 59, 59, 999);
  
  // 1. Get donations (income) within date range
  const donations = await db
    .select({
      id: Donation.id,
      amount: Donation.amount,
      date: Donation.date,
      type: Donation.type,
      donorId: Donation.donorId,
      donorName: sql`${Donor.firstName} || ' ' || ${Donor.lastName}`,
      transactionType: sql`'income'::text`,
      description: sql`'Donation'::text`
    })
    .from(Donation)
    .leftJoin(Donor, eq(Donation.donorId, Donor.id))
    .where(and(
      gte(Donation.date, start),
      lte(Donation.date, end)
    ));

  // 2. Get stock expenses within date range
  const stockExpenses = await db
    .select({
      stockId: stock.id,
      amount: sql`${DonationStock.amount} * -1`, // Negative to indicate expense
      date: DonationStock.createdAt,
      transactionType: sql`'expense'::text`,
      description: sql`'Stock purchase'::text`,
      donationId: DonationStock.donationId
    })
    .from(DonationStock)
    .leftJoin(stock, eq(DonationStock.stockId, stock.id))
    .where(and(
      gte(DonationStock.createdAt, start),
      lte(DonationStock.createdAt, end)
    ));

  // 3. Get receipt expenses within date range
  const receiptExpenses = await db
    .select({
      receiptId: receipt.id,
      amount: sql`${receiptDonations.amount} * -1`, // Negative to indicate expense
      date: receiptDonations.createdAt,
      transactionType: sql`'expense'::text`,
      description: sql`'Receipt coverage'::text`,
      donationId: receiptDonations.donationId
    })
    .from(receiptDonations)
    .leftJoin(receipt, eq(receiptDonations.receiptId, receipt.id))
    .where(and(
      gte(receiptDonations.createdAt, start),
      lte(receiptDonations.createdAt, end)
    ));
    
  // 4. Get material expenses within date range
  const materialExpenses = await db
    .select({
      materialId: materialDonations.id,
      amount: sql`${materialDonations.amount} * -1`, // Negative to indicate expense
      date: materialDonations.createdAt,
      transactionType: sql`'expense'::text`,
      description: sql`'Material donation'::text`,
      donationId: materialDonations.donationId
    })
    .from(materialDonations)
    .where(and(
      gte(materialDonations.createdAt, start),
      lte(materialDonations.createdAt, end)
    ));

  // 5. Combine all transactions and sort by date (chronological order)
  const allTransactions = [...donations, ...stockExpenses, ...receiptExpenses, ...materialExpenses]
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // 6. Calculate running balance
  let runningBalance = 0;
  const transactionsWithBalance = allTransactions.map(transaction => {
    runningBalance += Number(transaction.amount);
    return {
      ...transaction,
      balance: runningBalance
    };
  });

  // Display most recent transactions first
  const reverseTransactions = [...transactionsWithBalance].reverse();
  
  // Calculate summary for the period
  const totalIncome = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const totalExpenses = 
    stockExpenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0) +
    receiptExpenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0) +
    materialExpenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);

  // Response
  res.status(200).json({
    status: 'success',
    results: transactionsWithBalance.length,
    data: {
      dateRange: {
        from: start.toISOString().split('T')[0],
        to: end.toISOString().split('T')[0]
      },
      summary: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses
      },
      transactions: reverseTransactions,
      finalBalance: runningBalance
    }
  });
});

