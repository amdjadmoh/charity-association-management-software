const { products } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllProducts = catchAsync(async (req, res) => {
  const productsList = await db.select().from(products);
  // get product quantity
  
  res.status(200).json({
    status: 'success',
    results: productsList.length,
    data: { products: productsList }
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await db.select()
    .from(products)
    .where(eq(products.id, req.params.id))
    .limit(1);
  
  if (!product.length) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product: product[0] }
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  // Validate unit price if provided
  if (req.body.unitPrice && req.body.unitPrice < 0) {
    return next(new AppError('Unit price cannot be negative', 400));
  }

  const newProduct = await db.insert(products)
    .values(req.body)
    .returning();
  
  res.status(201).json({
    status: 'success',
    data: { product: newProduct[0] }
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  // Validate unit price if provided
  if (req.body.unitPrice && req.body.unitPrice < 0) {
    return next(new AppError('Unit price cannot be negative', 400));
  }

  const updatedProduct = await db.update(products)
    .set({
      ...req.body,
      updatedAt: new Date()
    })
    .where(eq(products.id, req.params.id))
    .returning();

  if (!updatedProduct.length) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product: updatedProduct[0] }
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const deletedProduct = await db.delete(products)
    .where(eq(products.id, req.params.id))
    .returning();

  if (!deletedProduct.length) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
