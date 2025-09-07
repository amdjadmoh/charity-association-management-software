const { Donor, Donation,DonationStock} = require('../db/schema');
const { db } = require('../db');
const { eq,gt } = require('drizzle-orm');
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

exports.getDonorDonations = catchAsync(async (req, res, next) => {
  const donations = await db.select().from(Donation)
    .where(eq(Donation.donorId, req.params.id));

  if (!donations.length) {
    return next(new AppError('No donations found for this donor', 404));
  }

  res.status(200).json({
    status: 'success',
    results: donations.length,
    data: { donations }
  });
}
);

exports.createDonation = catchAsync(async (req, res, next) => {
  const { donorId, date, ...donationData } = req.body;

  // Validate donor exists
  const donorExists = await db
    .select()
    .from(Donor)
    .where(eq(Donor.id, donorId))
    .limit(1);

  if (!donorExists.length) {
    return next(new AppError('Donor not found', 404));
  }

  // Convert string date to Date object if provided
  const donationValues = { ...donationData, donorId };
  if (date) {
    donationValues.date = new Date(date);
  }

  const newDonation = await db.insert(Donation).values(donationValues).returning();

  res.status(201).json({
    status: 'success',
    data: { donation: newDonation[0] }
  });
});

exports.updateDonation = catchAsync(async (req, res, next) => {
  const { donorId, date, ...donationData } = req.body;
  
  // check if donor exists
  const existingDonor = await db.select().from(Donor).where(eq(Donor.id, donorId)).limit(1);
  if (!existingDonor.length) {
    return next(new AppError('Donor not found', 404));
  }
  
  if (req.body.usedAmount) {
    return next(new AppError('Cannot update usedAmount directly', 400));
  }
  
  // Convert string date to Date object if provided
  const updateValues = { ...donationData };
  if (date) {
    updateValues.date = new Date(date);
  }
  
  const updatedDonation = await db.update(Donation)
    .set(updateValues)
    .where(eq(Donation.id, req.params.id))
    .returning();
    
  if (!updatedDonation.length) {
    return next(new AppError('No donation found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: { donation: updatedDonation[0] }
  });
});
exports.deleteDonation = catchAsync(async (req, res, next) => {
  const deletedDonation = await db.delete(Donation)
    .where(eq(Donation.id, req.params.id))
    .returning();

  if (!deletedDonation.length) {
    return next(new AppError('No donation found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllDonations = catchAsync(async (req, res) => {
  const donations = await db.select().from(Donation);
  res.status(200).json({
    status: 'success',
    results: donations.length,
    data: { donations }
  });
}
);

exports.getDonation = catchAsync(async (req, res, next) => {
  const donation = await db.select().from(Donation).where(eq(Donation.id, req.params.id)).limit(1);
  
  if (!donation.length) {
    return next(new AppError('No donation found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { donation: donation[0] }
  });
}
);

exports.getNotUsedDonations = catchAsync(async (req, res) => {
  const notUsedDonations = await db.select().from(Donation)
    .where(gt(Donation.amount, Donation.usedAmount));

  res.status(200).json({
    status: 'success',
    results: notUsedDonations.length,
    data: { donations: notUsedDonations }
  });
}
);

