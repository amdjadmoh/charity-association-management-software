const { sack, sackProducts, sackPatients, products, patient, User, sackDistributionSnapshot } = require('../db/schema');
const { db } = require('../db');
const { eq, sql, and, desc, asc, gte, lte ,} = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// SACK CONTROLLERS

exports.getDistributedsacksinPeriod = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return next(new AppError('Please provide both startDate and endDate in the query parameters', 400));
  }
 const sacks= await db.select().from(sackPatients)
  .where(and(
    gte(sackPatients.distributionDate, new Date(startDate)),
    lte(sackPatients.distributionDate, new Date(endDate))
  ))
  .leftJoin(sack, eq(sackPatients.sackId, sack.id))
  .orderBy(desc(sackPatients.distributionDate), asc(sackPatients.id));
  res.status(200).json({
    status: 'success',
    results: sacks.length,
    data: { sacks }
  });
});

exports.getAllSacks = catchAsync(async (req, res) => {
  const sacks = await db
    .select({
      id: sack.id,
      name: sack.name,
      productCount: sql`COUNT(DISTINCT ${sackProducts.id})`,
    })
    .from(sack)
    .leftJoin(sackProducts, eq(sack.id, sackProducts.sackId))
    .leftJoin(sackPatients, eq(sack.id, sackPatients.sackId))
    .groupBy(sack.id);

  res.status(200).json({
    status: 'success',
    results: sacks.length,
    data: { sacks }
  });
});

exports.getSack = catchAsync(async (req, res, next) => {
  const sackData = await db
    .select()
    .from(sack)
    .where(eq(sack.id, req.params.id))
    .limit(1);

  if (!sackData.length) {
    return next(new AppError('No sack found with that ID', 404));
  }

  // Get products in this sack
  const sackProductsData = await db
    .select({
      id: sackProducts.id,
      productId: products.id,
      productName: products.productName,
      quantity: sackProducts.quantity,
      description: products.description,
      type: products.type,
      availableStock: products.quantity
    })
    .from(sackProducts)
    .leftJoin(products, eq(sackProducts.productId, products.id))
    .where(eq(sackProducts.sackId, req.params.id));


  res.status(200).json({
    status: 'success',
    data: { 
      sack: sackData[0],
      products: sackProductsData,
    }
  });
});

exports.createSack = catchAsync(async (req, res, next) => {
  const { name, productsArray } = req.body; // Changed variable name to productsArray

  if (!name) {
    return next(new AppError('Sack name is required', 400));
  }

  const result = await db.transaction(async (tx) => {
    // Create the sack
    const [newSack] = await tx
      .insert(sack)
      .values({
        name,
      })
      .returning();

    // If products are provided, add them to the sack
    if (productsArray && Array.isArray(productsArray) && productsArray.length > 0) {
      for (const product of productsArray) {
        // Check if product exists
        const productExists = await tx
          .select()
          .from(products)
          .where(eq(products.id, product.productId))
          .limit(1);

        if (!productExists.length) {
          throw new AppError(`Product with ID ${product.productId} not found`, 404);
        }

        // Add product to sack
        await tx
          .insert(sackProducts)
          .values({
            sackId: newSack.id,
            productId: product.productId,
            quantity: product.quantity || 1
          });
      }
    }

    return newSack;
  });

  res.status(201).json({
    status: 'success',
    data: { sack: result }
  });
});

exports.updateSack = catchAsync(async (req, res, next) => {
  const { name, productsArray } = req.body;

  if (!name) {
    return next(new AppError('Sack name is required', 400));
  }

  const result = await db.transaction(async (tx) => {
    // Check if sack exists
    const sackExists = await tx
      .select()
      .from(sack)
      .where(eq(sack.id, req.params.id))
      .limit(1);

    if (!sackExists.length) {
      throw new AppError('Sack not found', 404);
    }

    // Update sack name
    const [updatedSack] = await tx
      .update(sack)
      .set({ name })
      .where(eq(sack.id, req.params.id))
      .returning();

    // Delete existing products
    await tx.delete(sackProducts).where(eq(sackProducts.sackId, req.params.id));

    // Add new products
    if (productsArray && Array.isArray(productsArray) && productsArray.length > 0) {
      for (const product of productsArray) {
        // Check if product exists
        const productExists = await tx
          .select()
          .from(products)
          .where(eq(products.id, product.productId))
          .limit(1);

        if (!productExists.length) {
          throw new AppError(`Product with ID ${product.productId} not found`, 404);
        }

        // Add product to sack
        await tx
          .insert(sackProducts)
          .values({
            sackId: req.params.id,
            productId: product.productId,
            quantity: product.quantity || 1
          });
      }
    }

    return updatedSack;
  });

  res.status(200).json({
    status: 'success',
    data: { sack: result }
  });
});

// SACK PRODUCTS CONTROLLERS
exports.getSackProducts = catchAsync(async (req, res, next) => {
  // Check if sack exists
  const sackExists = await db
    .select()
    .from(sack)
    .where(eq(sack.id, req.params.sackId))
    .limit(1);

  if (!sackExists.length) {
    return next(new AppError('No sack found with that ID', 404));
  }

  // Get products
  const sackProductsData = await db
    .select({
      id: sackProducts.id,
      productId: products.id,
      productName: products.productName,
      quantity: sackProducts.quantity,
      description: products.description,
      type: products.type,
      availableStock: products.quantity
    })
    .from(sackProducts)
    .leftJoin(products, eq(sackProducts.productId, products.id))
    .where(eq(sackProducts.sackId, req.params.sackId));

  res.status(200).json({
    status: 'success',
    results: sackProductsData.length,
    data: { products: sackProductsData }
  });
});



// DISTRIBUTION CONTROLLERS

exports.distributeSackToPatient = catchAsync(async (req, res, next) => {
  const { patientId, quantity ,distributedBy,distributionDate} = req.body;

  if (!patientId) {
    return next(new AppError('Please provide patient ID', 400));
  }

  const result = await db.transaction(async (tx) => {
    // Check if sack exists
    const sackExists = await tx
      .select()
      .from(sack)
      .where(eq(sack.id, req.params.sackId))
      .limit(1);

    if (!sackExists.length) {
      throw new AppError('No sack found with that ID', 404);
    }
    // check if there is enough products
    const sackProductsData = await tx
      .select()
      .from(sackProducts)
      .where(eq(sackProducts.sackId, req.params.sackId));
    for (const sackProduct of sackProductsData) {
        const product = await tx
          .select()
          .from(products)
          .where(eq(products.id, sackProduct.productId))
          .limit(1);

        if (!product.length) {
          throw new AppError(`Product with ID ${sackProduct.productId} not found`, 404);
        }

        // Check if there is enough stock
        if (sackProduct.quantity > product[0].quantity) {
          throw new AppError(`Not enough stock for product ${product[0].name}`, 400);
        }
      }

    // Check if patient exists
    const patientExists = await tx
      .select()
      .from(patient)
      .where(eq(patient.id, patientId))
      .limit(1);

    if (!patientExists.length) {
      throw new AppError('No patient found with that ID', 404);
    }

    // Create a snapshot of current products in the sack
    const sackProductsSnapshot = await tx
      .select({
        productId: sackProducts.productId,
        productName: products.productName,
        quantity: sackProducts.quantity,
        description: products.description,
        type: products.type
      })
      .from(sackProducts)
      .leftJoin(products, eq(sackProducts.productId, products.id))
      .where(eq(sackProducts.sackId, req.params.sackId));

    // Create distribution record
    const [distribution] = await tx
      .insert(sackPatients)
      .values({
        sackId: req.params.sackId,
        patientId,
        quantity,
        distributedBy,
        distributionDate,
        productsSnapshot: sackProductsSnapshot
      })
      .returning();
    // update products quantity
 for (const product of sackProductsData) {
  await tx
    .update(products)
    .set({ 
      quantity: sql`${products.quantity} - ${product.quantity}` 
    })
    .where(eq(products.id, product.productId));
}
   

    return {
      ...distribution,
      productsSnapshot: sackProductsSnapshot
    };
  });

  res.status(201).json({
    status: 'success',
    data: { distribution: result }
  });
});




exports.getDistribution = catchAsync(async (req, res, next) => {
  const distribution = await db
    .select({
      id: sackPatients.id,
      sackId: sack.id,
      sackName: sack.name,
      patientId: patient.id,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      celiacID: patient.celiacID,
      quantity: sackPatients.quantity,
      distributionDate: sackPatients.distributionDate,
      distributedBy: sql`${User.firstName} || ' ' || ${User.lastName}`,
      productsSnapshot: sackPatients.productsSnapshot
    })
    .from(sackPatients)
    .leftJoin(sack, eq(sackPatients.sackId, sack.id))
    .leftJoin(patient, eq(sackPatients.patientId, patient.id))
    .leftJoin(User, eq(sackPatients.distributedBy, User.id))
    .where(eq(sackPatients.id, req.params.id))
    .limit(1);

  if (!distribution.length) {
    return next(new AppError('No distribution found with that ID', 404));
  }


  res.status(200).json({
    status: 'success',
    data: { 
      distribution: distribution[0],
    }
  });
});

exports.getPatientDistributions = catchAsync(async (req, res, next) => {
  // Check if patient exists
  const patientExists = await db
    .select()
    .from(patient)
    .where(eq(patient.id, req.params.patientId))
    .limit(1);

  if (!patientExists.length) {
    return next(new AppError('No patient found with that ID', 404));
  }

  const distributions = await db
    .select({
      id: sackPatients.id,
      sackId: sack.id,
      sackName: sack.name,
      quantity: sackPatients.quantity,
      distributionDate: sackPatients.distributionDate,
      distributedBy: sql`${User.firstName} || ' ' || ${User.lastName}`,
      productsSnapshot: sackPatients.productsSnapshot,
    })
    .from(sackPatients)
    .leftJoin(sack, eq(sackPatients.sackId, sack.id))
    .leftJoin(User, eq(sackPatients.distributedBy, User.id))
    .where(eq(sackPatients.patientId, req.params.patientId))
    .orderBy(desc(sackPatients.distributionDate));

  const distributionsWithProducts = distributions.map(dist => ({
    id: dist.id,
    sackId: dist.sackId,
    sackName: dist.sackName,
    quantity: dist.quantity,
    distributionDate: dist.distributionDate,
    distributedBy: dist.distributedBy,
    products: dist.productsSnapshot || [],
  }));

  res.status(200).json({
    status: 'success',
    results: distributions.length,
    data: { 
      patient: patientExists[0],
      distributions: distributionsWithProducts
    }
  });
});

exports.deleteDistribution = catchAsync(async (req, res, next) => {
  const result = await db.transaction(async (tx) => {
    // Find the distribution
    const distribution = await tx
      .select()
      .from(sackPatients)
      .where(eq(sackPatients.id, req.params.id))
      .limit(1);

    if (!distribution.length) {
      throw new AppError('No distribution found with that ID', 404);
    }

    // Restore product quantities from the snapshot
    const snapshot = distribution[0].productsSnapshot;
    if (snapshot && Array.isArray(snapshot)) {
      for (const item of snapshot) {
        await tx
          .update(products)
          .set({
            quantity: sql`${products.quantity} + ${item.quantity}`
          })
          .where(eq(products.id, item.productId));
      }
    }

    // Delete the distribution record
    await tx.delete(sackPatients).where(eq(sackPatients.id, req.params.id));

    return distribution[0];
  });

  res.status(200).json({
    status: 'success',
    message: 'Distribution deleted and stock restored',
    data: { distribution: result }
  });
});

exports.getSackDistributions = catchAsync(async (req, res, next) => {
  // Check if sack exists
  const sackExists = await db
    .select()
    .from(sack)
    .where(eq(sack.id, req.params.sackId))
    .limit(1);

  if (!sackExists.length) {
    return next(new AppError('No sack found with that ID', 404));
  }

  const distributions = await db
    .select({
      id: sackPatients.id,
      patientId: patient.id,
      patientName: sql`${patient.firstName} || ' ' || ${patient.lastName}`,
      celiacID: patient.celiacID,
      quantity: sackPatients.quantity,
      distributionDate: sackPatients.distributionDate,
      distributedBy: sql`${User.firstName} || ' ' || ${User.lastName}`,
    })
    .from(sackPatients)
    .leftJoin(patient, eq(sackPatients.patientId, patient.id))
    .leftJoin(User, eq(sackPatients.distributedBy, User.id))
    .where(eq(sackPatients.sackId, req.params.sackId))
    .orderBy(desc(sackPatients.distributionDate));

  res.status(200).json({
    status: 'success',
    results: distributions.length,
    data: { 
      sack: sackExists[0],
      distributions: distributions
    }
  });
});



module.exports = exports;
