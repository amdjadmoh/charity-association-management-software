const { supplyRequest, products, material, materialTypes } = require('../db/schema');
const { db } = require('../db');
const { eq, sql, desc, and, or, between } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all supply requests
exports.getAllSupplyRequests = catchAsync(async (req, res) => {
  const allRequests = await db
    .select({
      ...supplyRequest,
      productName: products.productName,
      materialName: sql`CASE 
        WHEN ${supplyRequest.materialId} IS NOT NULL 
        THEN ${material.inventory_number} || ' - ' || ${materialTypes.name}
        ELSE NULL
      END`,
    })
    .from(supplyRequest)
    .leftJoin(products, eq(supplyRequest.productId, products.id))
    .leftJoin(material, eq(supplyRequest.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .orderBy(desc(supplyRequest.requestDate));

  res.status(200).json({
    status: 'success',
    results: allRequests.length,
    data: { supplyRequests: allRequests }
  });
});

// Get a single supply request by ID
exports.getSupplyRequest = catchAsync(async (req, res, next) => {
  const requestData = await db
    .select({
      ...supplyRequest,
      productName: products.productName,
      materialName: sql`CASE 
        WHEN ${supplyRequest.materialId} IS NOT NULL 
        THEN ${material.inventory_number} || ' - ' || ${materialTypes.name}
        ELSE NULL
      END`,
    })
    .from(supplyRequest)
    .leftJoin(products, eq(supplyRequest.productId, products.id))
    .leftJoin(material, eq(supplyRequest.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .where(eq(supplyRequest.id, req.params.id))
    .limit(1);

  if (!requestData.length) {
    return next(new AppError('No supply request found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { supplyRequest: requestData[0] }
  });
});

// Create a new supply request
exports.createSupplyRequest = catchAsync(async (req, res, next) => {
  const { type, productId, materialId, quantity, source, notes } = req.body;
  
  // Validate required fields
  if (!type || !quantity) {
    return next(new AppError('Type and quantity are required fields', 400));
  }
  
  // Validate type is either 'product' or 'material'
  if (type !== 'product' && type !== 'material') {
    return next(new AppError('Type must be either "product" or "material"', 400));
  }
  
  // Validate correct ID is provided based on type
  if (type === 'product' && !productId) {
    return next(new AppError('Product ID is required for product supply requests', 400));
  }
  
  if (type === 'material' && !materialId) {
    return next(new AppError('Material ID is required for material supply requests', 400));
  }
  
  // Create new supply request
  const newRequest = await db.insert(supplyRequest).values({
    type,
    productId: type === 'product' ? productId : null,
    materialId: type === 'material' ? materialId : null,
    quantity,
    source: source || null,
    notes: notes || null,
    requestDate: new Date()
  }).returning();

  res.status(201).json({
    status: 'success',
    data: { supplyRequest: newRequest[0] }
  });
});

// Update a supply request
exports.updateSupplyRequest = catchAsync(async (req, res, next) => {
  const { type, productId, materialId, quantity, source, notes, requestDate } = req.body;
  
  // Verify request exists
  const existingRequest = await db
    .select()
    .from(supplyRequest)
    .where(eq(supplyRequest.id, req.params.id))
    .limit(1);

  if (!existingRequest.length) {
    return next(new AppError('No supply request found with that ID', 404));
  }
  
  // Build update object with only provided fields
  const updateData = {};
  
  if (type !== undefined) {
    if (type !== 'product' && type !== 'material') {
      return next(new AppError('Type must be either "product" or "material"', 400));
    }
    updateData.type = type;
  }
  
  if (productId !== undefined) {
    updateData.productId = productId;
  }
  
  if (materialId !== undefined) {
    updateData.materialId = materialId;
  }
  
  if (quantity !== undefined) {
    updateData.quantity = quantity;
  }
  
  if (source !== undefined) {
    updateData.source = source;
  }
  
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  
  if (requestDate !== undefined) {
    updateData.requestDate = new Date(requestDate);
  }
  
  // Update the supply request
  const updatedRequest = await db
    .update(supplyRequest)
    .set(updateData)
    .where(eq(supplyRequest.id, req.params.id))
    .returning();

  res.status(200).json({
    status: 'success',
    data: { supplyRequest: updatedRequest[0] }
  });
});

// Delete a supply request
exports.deleteSupplyRequest = catchAsync(async (req, res, next) => {
  const deletedRequest = await db
    .delete(supplyRequest)
    .where(eq(supplyRequest.id, req.params.id))
    .returning();

  if (!deletedRequest.length) {
    return next(new AppError('No supply request found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Get supply requests by date range
exports.getSupplyRequestsByDateRange = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(new AppError('Please provide both startDate and endDate', 400));
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Set to end of day
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new AppError('Invalid date format. Please use YYYY-MM-DD format', 400));
  }
  
  const requestsInRange = await db
    .select({
      ...supplyRequest,
      productName: products.productName,
      materialName: sql`CASE 
        WHEN ${supplyRequest.materialId} IS NOT NULL 
        THEN ${material.inventory_number} || ' - ' || ${materialTypes.name}
        ELSE NULL
      END`,
    })
    .from(supplyRequest)
    .leftJoin(products, eq(supplyRequest.productId, products.id))
    .leftJoin(material, eq(supplyRequest.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .where(between(supplyRequest.requestDate, start, end))
    .orderBy(desc(supplyRequest.requestDate));

  res.status(200).json({
    status: 'success',
    results: requestsInRange.length,
    data: { 
      supplyRequests: requestsInRange,
      dateRange: {
        startDate: start,
        endDate: end
      }
    }
  });
});

// Get supply requests by type (product or material)
exports.getSupplyRequestsByType = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  
  if (type !== 'product' && type !== 'material') {
    return next(new AppError('Type must be either "product" or "material"', 400));
  }
  
  const requestsByType = await db
    .select({
      ...supplyRequest,
      productName: products.productName,
      materialName: sql`CASE 
        WHEN ${supplyRequest.materialId} IS NOT NULL 
        THEN ${material.inventory_number} || ' - ' || ${materialTypes.name}
        ELSE NULL
      END`,
    })
    .from(supplyRequest)
    .leftJoin(products, eq(supplyRequest.productId, products.id))
    .leftJoin(material, eq(supplyRequest.materialId, material.id))
    .leftJoin(materialTypes, eq(material.typeId, materialTypes.id))
    .where(eq(supplyRequest.type, type))
    .orderBy(desc(supplyRequest.requestDate));

  res.status(200).json({
    status: 'success',
    results: requestsByType.length,
    data: { supplyRequests: requestsByType }
  });
});
