const { patient, disease, city } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllPatients = catchAsync(async (req, res) => {
  const patients = await db
    .select({
      ...patient,
      diseaseName: disease.name,
      cityName: city.name
    })
    .from(patient)
    .leftJoin(disease, eq(patient.disease, disease.id))
    .leftJoin(city, eq(patient.city, city.id));

  res.status(200).json({
    status: 'success',
    results: patients.length,
    data: { patients }
  });
});

exports.getPatient = catchAsync(async (req, res, next) => {
  const patientData = await db
    .select({
      ...patient,
      diseaseName: disease.name,
      cityName: city.name
    })
    .from(patient)
    .leftJoin(disease, eq(patient.disease, disease.id))
    .leftJoin(city, eq(patient.city, city.id))
    .where(eq(patient.id, req.params.id))
    .limit(1);
  
  if (!patientData.length) {
    return next(new AppError('No patient found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { patient: patientData[0] }
  });
});

exports.createPatient = catchAsync(async (req, res, next) => {
  // Validate disease exists
  if(req.body.disease){
  const diseaseExists = await db
    .select()
    .from(disease)
    .where(eq(disease.id, req.body.disease))
    .limit(1);

  if (!diseaseExists.length) {
    return next(new AppError('Disease not found', 404));
  }
  }
  // Validate city exists
  if (req.body.city) {
  const cityExists = await db
    .select()
    .from(city)
    .where(eq(city.id, req.body.city))
    .limit(1);

  if (!cityExists.length) {
    return next(new AppError('City not found', 404));
  }
  }

  const newPatient = await db.insert(patient).values(req.body).returning();
  
  res.status(201).json({
    status: 'success',
    data: { patient: newPatient[0] }
  });
});

exports.updatePatient = catchAsync(async (req, res, next) => {
  if (req.body.disease) {
    // Validate disease exists
    const diseaseExists = await db
      .select()
      .from(disease)
      .where(eq(disease.id, req.body.disease))
      .limit(1);

    if (!diseaseExists.length) {
      return next(new AppError('Disease not found', 404));
    }
  }

  if (req.body.city) {
    // Validate city exists
    const cityExists = await db
      .select()
      .from(city)
      .where(eq(city.id, req.body.city))
      .limit(1);

    if (!cityExists.length) {
      return next(new AppError('City not found', 404));
    }
  }

  const updatedPatient = await db.update(patient)
    .set(req.body)
    .where(eq(patient.id, req.params.id))
    .returning();

  if (!updatedPatient.length) {
    return next(new AppError('No patient found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { patient: updatedPatient[0] }
  });
});

exports.deletePatient = catchAsync(async (req, res, next) => {
  const deletedPatient = await db.delete(patient)
    .where(eq(patient.id, req.params.id))
    .returning();

  if (!deletedPatient.length) {
    return next(new AppError('No patient found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
