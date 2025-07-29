const { city } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllCities = catchAsync(async (req, res) => {
  const cities = await db.select().from(city);
  res.status(200).json({
    status: 'success',
    results: cities.length,
    data: { cities }
  });
});

exports.getCity = catchAsync(async (req, res, next) => {
  const cityData = await db.select().from(city).where(eq(city.id, req.params.id)).limit(1);
  
  if (!cityData.length) {
    return next(new AppError('No city found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { city: cityData[0] }
  });
});

exports.createCity = catchAsync(async (req, res) => {
  const newCity = await db.insert(city).values(req.body).returning();
  
  res.status(201).json({
    status: 'success',
    data: { city: newCity[0] }
  });
});

exports.updateCity = catchAsync(async (req, res, next) => {
  const updatedCity = await db.update(city)
    .set(req.body)
    .where(eq(city.id, req.params.id))
    .returning();

  if (!updatedCity.length) {
    return next(new AppError('No city found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { city: updatedCity[0] }
  });
});

exports.deleteCity = catchAsync(async (req, res, next) => {
  const deletedCity = await db.delete(city)
    .where(eq(city.id, req.params.id))
    .returning();

  if (!deletedCity.length) {
    return next(new AppError('No city found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
