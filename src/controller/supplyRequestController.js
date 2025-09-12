const { supplyRequest, products, material, materialTypes, supplyRequestProducts, supplyRequestMaterials } = require('../db/schema');
const { db } = require('../db');
const { eq, sql, desc, and, or, between } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all supply requests
exports.getAllSupplyRequests = catchAsync(async (req, res) => {
  // Get all supply requests
  const requests = await db
    .select()
    .from(supplyRequest)
    .orderBy(desc(supplyRequest.requestDate));

  // Enhance each supply request with product and material details
  const enhancedRequests = await Promise.all(
    requests.map(async (request) => {
      // Get products for this request
      const productsTable = products;  // Rename to avoid confusion
      const requestProducts = await db
        .select({
          id: supplyRequestProducts.id,
          productId: supplyRequestProducts.productId,
          quantity: supplyRequestProducts.quantity,
          name: productsTable.productName,
          type: productsTable.type,
          description: productsTable.description
        })
        .from(supplyRequestProducts)
        .leftJoin(productsTable, eq(supplyRequestProducts.productId, productsTable.id))
        .where(eq(supplyRequestProducts.supplyRequestId, request.id));

      // Get materials for this request
      const materialTable = material;  // Rename to avoid confusion
      const requestMaterials = await db
        .select({
          id: supplyRequestMaterials.id,
          materialId: supplyRequestMaterials.materialId,
          quantity: supplyRequestMaterials.quantity,
          inventoryNumber: materialTable.inventory_number,
          typeName: materialTypes.name,
          status: materialTable.status,
          notes: materialTable.notes
        })
        .from(supplyRequestMaterials)
        .leftJoin(materialTable, eq(supplyRequestMaterials.materialId, materialTable.id))
        .leftJoin(materialTypes, eq(materialTable.typeId, materialTypes.id))
        .where(eq(supplyRequestMaterials.supplyRequestId, request.id));
      
      return {
        ...request,
        products: requestProducts,
        materials: requestMaterials
      };
    })
  );

  res.status(200).json({
    status: 'success',
    results: enhancedRequests.length,
    data: { supplyRequests: enhancedRequests }
  });
});

// Get a single supply request by ID
exports.getSupplyRequest = catchAsync(async (req, res, next) => {
  const requestData = await db
    .select()
    .from(supplyRequest)
    .where(eq(supplyRequest.id, req.params.id))
    .limit(1);

  if (!requestData.length) {
    return next(new AppError('No supply request found with that ID', 404));
  }

  const request = requestData[0];
  
  // Get products for this request
  const productsTable = products;  // Rename to avoid confusion
  const requestProducts = await db
    .select({
      id: supplyRequestProducts.id,
      productId: supplyRequestProducts.productId,
      quantity: supplyRequestProducts.quantity,
      name: productsTable.productName,
      type: productsTable.type,
      description: productsTable.description
    })
    .from(supplyRequestProducts)
    .leftJoin(productsTable, eq(supplyRequestProducts.productId, productsTable.id))
    .where(eq(supplyRequestProducts.supplyRequestId, request.id));

  // Get materials for this request
  const materialTable = material;  // Rename to avoid confusion
  const requestMaterials = await db
    .select({
      id: supplyRequestMaterials.id,
      materialId: supplyRequestMaterials.materialId,
      quantity: supplyRequestMaterials.quantity,
      inventoryNumber: materialTable.inventory_number,
      typeName: materialTypes.name,
      status: materialTable.status,
      notes: materialTable.notes
    })
    .from(supplyRequestMaterials)
    .leftJoin(materialTable, eq(supplyRequestMaterials.materialId, materialTable.id))
    .leftJoin(materialTypes, eq(materialTable.typeId, materialTypes.id))
    .where(eq(supplyRequestMaterials.supplyRequestId, request.id));
  
  const enhancedRequest = {
    ...request,
    products: requestProducts,
    materials: requestMaterials
  };

  res.status(200).json({
    status: 'success',
    data: { supplyRequest: enhancedRequest }
  });
});

// Create a new supply request
exports.createSupplyRequest = catchAsync(async (req, res, next) => {
  const { type, products: reqProducts, materials: reqMaterials, source, notes, requestDate } = req.body;
  
  // Get schema table references to avoid name conflicts
  const productsTable = products;
  const materialTable = material;
  
  // Validate required fields
  if (!type) {
    return next(new AppError('Type is a required field', 400));
  }
  
  // Validate type is either 'product', 'material', or 'mixed'
  if (!['product', 'material', 'mixed'].includes(type)) {
    return next(new AppError('Type must be either "product", "material", or "mixed"', 400));
  }
  
  // Validate correct data is provided based on type
  if ((type === 'product' || type === 'mixed') && (!reqProducts || !Array.isArray(reqProducts) || !reqProducts.length)) {
    return next(new AppError('Products data is required for product or mixed supply requests', 400));
  }
  
  if ((type === 'material' || type === 'mixed') && (!reqMaterials || !Array.isArray(reqMaterials) || !reqMaterials.length)) {
    return next(new AppError('Materials data is required for material or mixed supply requests', 400));
  }
  
  // Validate each product and material has id and quantity
  if (reqProducts && Array.isArray(reqProducts)) {
    const invalidProducts = reqProducts.filter(p => !p.productId || !p.quantity || p.quantity <= 0);
    if (invalidProducts.length > 0) {
      return next(new AppError('Each product must have a valid productId and positive quantity', 400));
    }
  }
  
  if (reqMaterials && Array.isArray(reqMaterials)) {
    const invalidMaterials = reqMaterials.filter(m => !m.materialId || !m.quantity || m.quantity <= 0);
    if (invalidMaterials.length > 0) {
      return next(new AppError('Each material must have a valid materialId and positive quantity', 400));
    }
  }
  
  // Use transaction to ensure all operations succeed or fail together
  const result = await db.transaction(async (tx) => {
    // Create new supply request
    const newRequest = await tx
      .insert(supplyRequest)
      .values({
        type,
        source: source || null,
        notes: notes || null,
        requestDate: requestDate || new Date()
      })
      .returning();
    
    const createdRequest = newRequest[0];

    // Insert product relationships if provided
    let productsWithDetails = [];
    if (reqProducts && reqProducts.length) {
      // Insert all product relations
      await Promise.all(
        reqProducts.map(async (product) => {
          await tx.insert(supplyRequestProducts).values({
            supplyRequestId: createdRequest.id,
            productId: product.productId,
            quantity: product.quantity
          });
        })
      );

      // Query the products with details
      productsWithDetails = await tx
        .select({
          id: supplyRequestProducts.id,
          productId: supplyRequestProducts.productId,
          quantity: supplyRequestProducts.quantity,
          name: productsTable.productName,
          type: productsTable.type,
          description: productsTable.description
        })
        .from(supplyRequestProducts)
        .leftJoin(productsTable, eq(supplyRequestProducts.productId, productsTable.id))
        .where(eq(supplyRequestProducts.supplyRequestId, createdRequest.id));
    }

    // Insert material relationships if provided
    let materialsWithDetails = [];
    if (reqMaterials && reqMaterials.length) {
      // Insert all material relations
      await Promise.all(
        reqMaterials.map(async (material) => {
          await tx.insert(supplyRequestMaterials).values({
            supplyRequestId: createdRequest.id,
            materialId: material.materialId,
            quantity: material.quantity
          });
        })
      );
      
      // Query the materials with details
      materialsWithDetails = await tx
        .select({
          id: supplyRequestMaterials.id,
          materialId: supplyRequestMaterials.materialId,
          quantity: supplyRequestMaterials.quantity,
          inventoryNumber: materialTable.inventory_number,
          typeName: materialTypes.name,
          status: materialTable.status,
          notes: materialTable.notes
        })
        .from(supplyRequestMaterials)
        .leftJoin(materialTable, eq(supplyRequestMaterials.materialId, materialTable.id))
        .leftJoin(materialTypes, eq(materialTable.typeId, materialTypes.id))
        .where(eq(supplyRequestMaterials.supplyRequestId, createdRequest.id));
    }
    
    return {
      ...createdRequest,
      products: productsWithDetails,
      materials: materialsWithDetails
    };
  });

  res.status(201).json({
    status: 'success',
    data: { supplyRequest: result }
  });
});

// Update a supply request
exports.updateSupplyRequest = catchAsync(async (req, res, next) => {
  const { type, products: reqProducts, materials: reqMaterials, source, notes, requestDate } = req.body;
  const supplyRequestId = parseInt(req.params.id);
  
  // Get schema table references to avoid name conflicts
  const productsTable = products;
  const materialTable = material;
  
  // Verify request exists
  const existingRequest = await db
    .select()
    .from(supplyRequest)
    .where(eq(supplyRequest.id, supplyRequestId))
    .limit(1);

  if (!existingRequest.length) {
    return next(new AppError('No supply request found with that ID', 404));
  }
  
  // Build update object with only provided fields
  const updateData = {};
  
  if (type !== undefined) {
    if (!['product', 'material', 'mixed'].includes(type)) {
      return next(new AppError('Type must be either "product", "material", or "mixed"', 400));
    }
    updateData.type = type;
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
  
  // Validate products and materials if provided
  if (reqProducts !== undefined) {
    if (!Array.isArray(reqProducts)) {
      return next(new AppError('Products must be an array', 400));
    }
    
    if (reqProducts.length > 0) {
      const invalidProducts = reqProducts.filter(p => !p.productId || !p.quantity || p.quantity <= 0);
      if (invalidProducts.length > 0) {
        return next(new AppError('Each product must have a valid productId and positive quantity', 400));
      }
    }
  }
  
  if (reqMaterials !== undefined) {
    if (!Array.isArray(reqMaterials)) {
      return next(new AppError('Materials must be an array', 400));
    }
    
    if (reqMaterials.length > 0) {
      const invalidMaterials = reqMaterials.filter(m => !m.materialId || !m.quantity || m.quantity <= 0);
      if (invalidMaterials.length > 0) {
        return next(new AppError('Each material must have a valid materialId and positive quantity', 400));
      }
    }
  }
  
  // Use transaction to ensure all operations succeed or fail together
  const result = await db.transaction(async (tx) => {
    // Update the supply request
    const updatedRequest = await tx
      .update(supplyRequest)
      .set(updateData)
      .where(eq(supplyRequest.id, supplyRequestId))
      .returning();
    
    const updated = updatedRequest[0];
    
    // Update products if provided
    if (reqProducts !== undefined) {
      // Delete existing product relationships
      await tx
        .delete(supplyRequestProducts)
        .where(eq(supplyRequestProducts.supplyRequestId, supplyRequestId));
      
      // Insert new product relationships
      if (reqProducts.length > 0) {
        await Promise.all(
          reqProducts.map(async (product) => {
            await tx.insert(supplyRequestProducts).values({
              supplyRequestId: supplyRequestId,
              productId: product.productId,
              quantity: product.quantity
            });
          })
        );
      }
    }
    
    // Update materials if provided
    if (reqMaterials !== undefined) {
      // Delete existing material relationships
      await tx
        .delete(supplyRequestMaterials)
        .where(eq(supplyRequestMaterials.supplyRequestId, supplyRequestId));
      
      // Insert new material relationships
      if (reqMaterials.length > 0) {
        await Promise.all(
          reqMaterials.map(async (material) => {
            await tx.insert(supplyRequestMaterials).values({
              supplyRequestId: supplyRequestId,
              materialId: material.materialId,
              quantity: material.quantity
            });
          })
        );
      }
    }
    
    // Get updated products for this request
    const requestProducts = await tx
      .select({
        id: supplyRequestProducts.id,
        productId: supplyRequestProducts.productId,
        quantity: supplyRequestProducts.quantity,
        name: productsTable.productName,
        type: productsTable.type,
        description: productsTable.description
      })
      .from(supplyRequestProducts)
      .leftJoin(productsTable, eq(supplyRequestProducts.productId, productsTable.id))
      .where(eq(supplyRequestProducts.supplyRequestId, supplyRequestId));

    // Get updated materials for this request
    const requestMaterials = await tx
      .select({
        id: supplyRequestMaterials.id,
        materialId: supplyRequestMaterials.materialId,
        quantity: supplyRequestMaterials.quantity,
        inventoryNumber: materialTable.inventory_number,
        typeName: materialTypes.name,
        status: materialTable.status,
        notes: materialTable.notes
      })
      .from(supplyRequestMaterials)
      .leftJoin(materialTable, eq(supplyRequestMaterials.materialId, materialTable.id))
      .leftJoin(materialTypes, eq(materialTable.typeId, materialTypes.id))
      .where(eq(supplyRequestMaterials.supplyRequestId, supplyRequestId));
    
    return {
      ...updated,
      products: requestProducts,
      materials: requestMaterials
    };
  });

  res.status(200).json({
    status: 'success',
    data: { supplyRequest: result }
  });
});

// Delete a supply request
exports.deleteSupplyRequest = catchAsync(async (req, res, next) => {
  const supplyRequestId = parseInt(req.params.id);
  
  // Verify request exists
  const existingRequest = await db
    .select()
    .from(supplyRequest)
    .where(eq(supplyRequest.id, supplyRequestId))
    .limit(1);

  if (!existingRequest.length) {
    return next(new AppError('No supply request found with that ID', 404));
  }
  
  // Use transaction to ensure all operations succeed or fail together
  await db.transaction(async (tx) => {
    // Delete related product records
    await tx
      .delete(supplyRequestProducts)
      .where(eq(supplyRequestProducts.supplyRequestId, supplyRequestId));
    
    // Delete related material records
    await tx
      .delete(supplyRequestMaterials)
      .where(eq(supplyRequestMaterials.supplyRequestId, supplyRequestId));
    
    // Delete the supply request
    await tx
      .delete(supplyRequest)
      .where(eq(supplyRequest.id, supplyRequestId));
  });

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
    .select()
    .from(supplyRequest)
    .where(between(supplyRequest.requestDate, start, end))
    .orderBy(desc(supplyRequest.requestDate));

  // Enhance each supply request with product and material details
  const enhancedRequests = await Promise.all(
    requestsInRange.map(async (request) => {
      // Get products for this request
      const productsTable = products;  // Rename to avoid confusion
      const requestProducts = await db
        .select({
          id: supplyRequestProducts.id,
          productId: supplyRequestProducts.productId,
          quantity: supplyRequestProducts.quantity,
          name: productsTable.productName,
          type: productsTable.type,
          description: productsTable.description
        })
        .from(supplyRequestProducts)
        .leftJoin(productsTable, eq(supplyRequestProducts.productId, productsTable.id))
        .where(eq(supplyRequestProducts.supplyRequestId, request.id));

      // Get materials for this request
      const materialTable = material;  // Rename to avoid confusion
      const requestMaterials = await db
        .select({
          id: supplyRequestMaterials.id,
          materialId: supplyRequestMaterials.materialId,
          quantity: supplyRequestMaterials.quantity,
          inventoryNumber: materialTable.inventory_number,
          typeName: materialTypes.name,
          status: materialTable.status,
          notes: materialTable.notes
        })
        .from(supplyRequestMaterials)
        .leftJoin(materialTable, eq(supplyRequestMaterials.materialId, materialTable.id))
        .leftJoin(materialTypes, eq(materialTable.typeId, materialTypes.id))
        .where(eq(supplyRequestMaterials.supplyRequestId, request.id));
      
      return {
        ...request,
        products: requestProducts,
        materials: requestMaterials
      };
    })
  );

  res.status(200).json({
    status: 'success',
    results: enhancedRequests.length,
    data: { 
      supplyRequests: enhancedRequests,
      dateRange: {
        startDate: start,
        endDate: end
      }
    }
  });
});

// Get supply requests by type (product, material, or mixed)
exports.getSupplyRequestsByType = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  
  if (!['product', 'material', 'mixed'].includes(type)) {
    return next(new AppError('Type must be either "product", "material", or "mixed"', 400));
  }
  
  const requestsByType = await db
    .select()
    .from(supplyRequest)
    .where(eq(supplyRequest.type, type))
    .orderBy(desc(supplyRequest.requestDate));

  // Enhance each supply request with product and material details
  const enhancedRequests = await Promise.all(
    requestsByType.map(async (request) => {
      // Get products for this request
      const productsTable = products;  // Rename to avoid confusion
      const requestProducts = await db
        .select({
          id: supplyRequestProducts.id,
          productId: supplyRequestProducts.productId,
          quantity: supplyRequestProducts.quantity,
          name: productsTable.productName,
          type: productsTable.type,
          description: productsTable.description
        })
        .from(supplyRequestProducts)
        .leftJoin(productsTable, eq(supplyRequestProducts.productId, productsTable.id))
        .where(eq(supplyRequestProducts.supplyRequestId, request.id));

      // Get materials for this request
      const materialTable = material;  // Rename to avoid confusion
      const requestMaterials = await db
        .select({
          id: supplyRequestMaterials.id,
          materialId: supplyRequestMaterials.materialId,
          quantity: supplyRequestMaterials.quantity,
          inventoryNumber: materialTable.inventory_number,
          typeName: materialTypes.name,
          status: materialTable.status,
          notes: materialTable.notes
        })
        .from(supplyRequestMaterials)
        .leftJoin(materialTable, eq(supplyRequestMaterials.materialId, materialTable.id))
        .leftJoin(materialTypes, eq(materialTable.typeId, materialTypes.id))
        .where(eq(supplyRequestMaterials.supplyRequestId, request.id));
      
      return {
        ...request,
        products: requestProducts,
        materials: requestMaterials
      };
    })
  );

  res.status(200).json({
    status: 'success',
    results: enhancedRequests.length,
    data: { supplyRequests: enhancedRequests }
  });
});
