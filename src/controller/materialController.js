const { material, materialTypes, Donation, materialDonations,materialLoans, patient,User } = require('../db/schema');
const { db } = require('../db');
const { eq, sql,and } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllMaterials = catchAsync(async (req, res) => {
  const materials = await db
    .select({
      ...material,
      typeName: materialTypes.name,
      activeLoanPatient: sql`STRING_AGG(DISTINCT CASE WHEN ${materialLoans.status} = 'active' THEN ${patient.firstName} || ' ' || ${patient.lastName} END, ', ')`
    })
    .from(material)
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .leftJoin(materialLoans, eq(material.id, materialLoans.materialId))
    .leftJoin(patient, eq(materialLoans.patientId, patient.id))
    .groupBy(material.id, materialTypes.name);

  res.status(200).json({
    status: 'success',
    results: materials.length,
    data: { materials }
  });
});

exports.getMaterial = catchAsync(async (req, res, next) => {
  // First get the material details with type info
  const materialItem = await db
    .select({
      ...material,
      typeName: materialTypes.name,
    })
    .from(material)
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .where(eq(material.id, req.params.id))
    .limit(1);
  
  if (!materialItem.length) {
    return next(new AppError('No material found with that ID', 404));
  }

  // Get active loan information if exists
  const activeLoan = await db
    .select({
      loanId: materialLoans.id,
      loanDate: materialLoans.loanDate,
      returnDate: materialLoans.returnDate,
      status: materialLoans.status,
      patientId: patient.id,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      patientPhone: patient.phoneNumber,
      lenderId: User.id,
      lenderName: sql`${User.firstName} || ' ' || ${User.lastName}`
    })
    .from(materialLoans)
    .leftJoin(patient, eq(materialLoans.patientId, patient.id))
    .leftJoin(User, eq(materialLoans.lenderId, User.id))
    .where(
      and(
        eq(materialLoans.materialId, req.params.id),
        eq(materialLoans.status, 'active')
      )
    )
    .limit(1);
  // Combine all information
  const result = {
    ...materialItem[0],
    activeLoan: activeLoan.length ? activeLoan[0] : null,
  };

  res.status(200).json({
    status: 'success',
    data: { material: result }
  });
});

exports.getMaterialsByType = catchAsync(async (req, res, next) => {
  // Check if type exists
  const typeExists = await db
    .select()
    .from(materialTypes)
    .where(eq(materialTypes.id, req.params.typeId))
    .limit(1);

  if (!typeExists.length) {
    return next(new AppError('No material type found with that ID', 404));
  }

  const materials = await db
    .select({
      ...material,
      typeName: materialTypes.name,
      activeLoanPatient: sql`STRING_AGG(DISTINCT CASE WHEN ${materialLoans.status} = 'active' THEN ${patient.firstName} || ' ' || ${patient.lastName} END, ', ')`
    })
    .from(material)
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .leftJoin(materialLoans, eq(material.id, materialLoans.materialId))
    .leftJoin(patient, eq(materialLoans.patientId, patient.id))
    .where(eq(material.typeId, req.params.typeId))
    .groupBy(material.id, materialTypes.name);

  res.status(200).json({
    status: 'success',
    results: materials.length,
    data: { materials }
  });
});

exports.createMaterial = catchAsync(async (req, res, next) => {
  const { inventory_number, typeId, price, notes, registration_date, donations } = req.body;

  // Input validation
  if (!Array.isArray(donations)) {
    return next(new AppError('Donations must be an array', 400));
  }

  if (price < 0) {
    return next(new AppError('Price cannot be negative', 400));
  }

  // Start transaction
  const result = await db.transaction(async (tx) => {
    // Check if type exists
    const type = await tx
      .select()
      .from(materialTypes)
      .where(eq(materialTypes.id, typeId))
      .limit(1);

    if (!type.length) {
      throw new AppError('No material type found with that ID', 404);
    }

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

    if (price > donationsTotal) {
      throw new AppError('Material price exceeds available donation amounts', 400);
    }

    // Create material entry
    const newMaterial = await tx.insert(material).values({
      inventory_number,
      typeId,
      price,
      notes,
      registration_date: registration_date || new Date()
    }).returning();

    // Process donations
    let donatedAmount = 0;
    for (const donation of donationDetails) {
      const amount = donatedAmount + donation.remainingAmount >= price
        ? price - donatedAmount
        : donation.remainingAmount;

      await tx.insert(materialDonations).values({
        materialId: newMaterial[0].id,
        donationId: donation.id,
        amount
      });

      await tx.update(Donation)
        .set({ usedAmount: donation.usedAmount + amount })
        .where(eq(Donation.id, donation.id));

      donatedAmount += amount;
      if (donatedAmount >= price) break;
    }

    return newMaterial[0];
  });

  res.status(201).json({
    status: 'success',
    data: { material: result }
  });
});

exports.updateMaterial = catchAsync(async (req, res, next) => {
    // cant update the price
    if (req.body.price) {
        return next(new AppError('Price cannot be updated', 400));
    }
  // Check if material exists
  const materialExists = await db
    .select()
    .from(material)
    .where(eq(material.id, req.params.id))
    .limit(1);

  if (!materialExists.length) {
    return next(new AppError('No material found with that ID', 404));
  }

  // If typeId is provided, check if it exists
  if (req.body.typeId) {
    const typeExists = await db
      .select()
      .from(materialTypes)
      .where(eq(materialTypes.id, req.body.typeId))
      .limit(1);

    if (!typeExists.length) {
      return next(new AppError('No material type found with that ID', 404));
    }
  }

  // Update the material
  const updatedMaterial = await db
    .update(material)
    .set(req.body)
    .where(eq(material.id, req.params.id))
    .returning();

  res.status(200).json({
    status: 'success',
    data: { material: updatedMaterial[0] }
  });
});

exports.deleteMaterial = catchAsync(async (req, res, next) => {
    // Check if material is loaned
    const loanedMaterial = await db
      .select()
      .from(materialLoans)
      .where(and(eq(materialLoans.materialId, req.params.id), eq(materialLoans.status, "active")))
      .limit(1);

  if (loanedMaterial.length) {
    return next(new AppError('Material is currently loaned out and cannot be deleted', 400));
  }

  const result = await db.transaction(async (tx) => {
    // Check if material exists
    const materialItem = await tx
      .select()
      .from(material)
      .where(eq(material.id, req.params.id))
      .limit(1);

    if (!materialItem.length) {
      throw new AppError('No material found with that ID', 404);
    }

    // Get related donation material entries
    const materialDonationEntries = await tx
      .select()
      .from(materialDonations)
      .where(eq(materialDonations.materialId, req.params.id));

    // Update donations used amounts
    for (const entry of materialDonationEntries) {
      await tx
        .update(Donation)
        .set({
          usedAmount: sql`${Donation.usedAmount} - ${entry.amount}`
        })
        .where(eq(Donation.id, entry.donationId));
    }

    // Delete material donation entries
    await tx
      .delete(materialDonations)
      .where(eq(materialDonations.materialId, req.params.id));

    // Delete the material entry
    const deletedMaterial = await tx
      .delete(material)
      .where(eq(material.id, req.params.id))
      .returning();

    return deletedMaterial[0];
  });

  res.status(200).json({
    status: 'success',
    data: { material: result }
  });
});
