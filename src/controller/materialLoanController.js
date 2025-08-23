const { materialLoans, material, patient, User, materialTypes } = require('../db/schema');
const { db } = require('../db');
const { eq, sql ,and} = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getActiveLoans = catchAsync(async (req, res) => {
  const loans = await db
    .select({
      ...materialLoans,
      materialInventoryNumber: material.inventory_number,
      materialType: materialTypes.name,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      lenderName: sql`${User.firstName} || ' ' || ${User.lastName}`
    })
    .from(materialLoans)
    .leftJoin(material, eq(materialLoans.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .leftJoin(patient, eq(materialLoans.patientId, patient.id))
    .leftJoin(User, eq(materialLoans.lenderId, User.id))
    .where(eq(materialLoans.status, 'active'));

  res.status(200).json({
    status: 'success',
    results: loans.length,
    data: { materialLoans: loans }
  });
});

exports.getMaterialLoan = catchAsync(async (req, res, next) => {
  const loan = await db
    .select({
      ...materialLoans,
      materialInventoryNumber: material.inventory_number,
      materialType: materialTypes.name,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      lenderName: sql`${User.firstName} || ' ' || ${User.lastName}`
    })
    .from(materialLoans)
    .leftJoin(material, eq(materialLoans.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .leftJoin(patient, eq(materialLoans.patientId, patient.id))
    .leftJoin(User, eq(materialLoans.lenderId, User.id))
    .where(eq(materialLoans.id, req.params.id))
    .limit(1);
  
  if (!loan.length) {
    return next(new AppError('No material loan found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { materialLoan: loan[0] }
  });
});

exports.getMaterialLoansByPatient = catchAsync(async (req, res, next) => {
  // Check if patient exists
  const patientExists = await db
    .select()
    .from(patient)
    .where(eq(patient.id, req.params.patientId))
    .limit(1);

  if (!patientExists.length) {
    return next(new AppError('No patient found with that ID', 404));
  }

  const loans = await db
    .select({
      ...materialLoans,
      materialInventoryNumber: material.inventory_number,
      materialType: materialTypes.name,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      lenderName: sql`${User.firstName} || ' ' || ${User.lastName}`
    })
    .from(materialLoans)
    .leftJoin(material, eq(materialLoans.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .leftJoin(patient, eq(materialLoans.patientId, patient.id))
    .leftJoin(User, eq(materialLoans.lenderId, User.id))
    .where(eq(materialLoans.patientId, req.params.patientId));

  res.status(200).json({
    status: 'success',
    results: loans.length,
    data: { materialLoans: loans }
  });
});

exports.getMaterialLoansByMaterial = catchAsync(async (req, res, next) => {
  // Check if material exists
  const materialExists = await db
    .select()
    .from(material)
    .where(eq(material.id, req.params.materialId))
    .limit(1);

  if (!materialExists.length) {
    return next(new AppError('No material found with that ID', 404));
  }
  

  const loans = await db
    .select({
      ...materialLoans,
      materialInventoryNumber: material.inventory_number,
      materialType: materialTypes.name,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      lenderName: sql`${User.firstName} || ' ' || ${User.lastName}`
    })
    .from(materialLoans)
    .leftJoin(material, eq(materialLoans.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .leftJoin(patient, eq(materialLoans.patientId, patient.id))
    .leftJoin(User, eq(materialLoans.lenderId, User.id))
    .where(eq(materialLoans.materialId, req.params.materialId));

  res.status(200).json({
    status: 'success',
    results: loans.length,
    data: { materialLoans: loans }
  });
});

exports.createMaterialLoan = catchAsync(async (req, res, next) => {
  const { materialId, patientId, loanDate, returnDate, lenderId } = req.body;

  // Check if material exists
  const materialExists = await db
    .select()
    .from(material)
    .where(eq(material.id, materialId))
    .limit(1);

  if (!materialExists.length) {
    return next(new AppError('No material found with that ID', 404));
  }

  // Check if patient exists
  const patientExists = await db
    .select()
    .from(patient)
    .where(eq(patient.id, patientId))
    .limit(1);

  if (!patientExists.length) {
    return next(new AppError('No patient found with that ID', 404));
  }

  // Check if lender exists
  const lenderExists = await db
    .select()
    .from(User)
    .where(eq(User.id, lenderId))
    .limit(1);

  if (!lenderExists.length) {
    return next(new AppError('No user found with that lender ID', 404));
  }

  // Check if material is already loaned (not returned yet)
  const existingLoans = await db
    .select()
    .from(materialLoans)
    .where(
      and(eq(materialLoans.materialId, materialId), eq(materialLoans.status, 'active')),
    )
    .limit(1);
    if (existingLoans.length) {
      return next(new AppError('Material is already loaned out', 400));
    }

  // Create the loan
  const newLoan = await db
    .insert(materialLoans)
    .values({
      materialId,
      patientId,
      loanDate: loanDate || new Date(),
      returnDate,
      lenderId
    })
    .returning();

  res.status(201).json({
    status: 'success',
    data: { materialLoan: newLoan[0] }
  });
});

exports.updateMaterialLoan = catchAsync(async (req, res, next) => {
  // Check if loan exists
  const loanExists = await db
    .select()
    .from(materialLoans)
    .where(eq(materialLoans.id, req.params.id))
    .limit(1);

  if (!loanExists.length) {
    return next(new AppError('No material loan found with that ID', 404));
  }

  // If materialId is provided, check if it exists
  if (req.body.materialId) {
    const materialExists = await db
      .select()
      .from(material)
      .where(eq(material.id, req.body.materialId))
      .limit(1);

    if (!materialExists.length) {
      return next(new AppError('No material found with that ID', 404));
    }
  }

  // If patientId is provided, check if it exists
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

  // If lenderId is provided, check if it exists
  if (req.body.lenderId) {
    const lenderExists = await db
      .select()
      .from(User)
      .where(eq(User.id, req.body.lenderId))
      .limit(1);

    if (!lenderExists.length) {
      return next(new AppError('No user found with that lender ID', 404));
    }
  }

  // Update the loan
  const updatedLoan = await db
    .update(materialLoans)
    .set(req.body)
    .where(eq(materialLoans.id, req.params.id))
    .returning();

  res.status(200).json({
    status: 'success',
    data: { materialLoan: updatedLoan[0] }
  });
});

exports.deleteMaterialLoan = catchAsync(async (req, res, next) => {
  const deletedLoan = await db
    .delete(materialLoans)
    .where(eq(materialLoans.id, req.params.id))
    .returning();

  if (!deletedLoan.length) {
    return next(new AppError('No material loan found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
