const { patient, disease, city, sackPatients} = require("../db/schema");
const { db } = require("../db");
const { eq ,desc,sql} = require("drizzle-orm");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getAllPatients = catchAsync(async (req, res) => {
  // First, get all patients with their basic information
  const patients = await db
    .select({
      ...patient,
      diseaseName: disease.name,
      cityName: city.name,
    })
    .from(patient)
    .leftJoin(disease, eq(patient.disease, disease.id))
    .leftJoin(city, eq(patient.city, city.id));
  
  // For each patient, fetch their last distribution date
  const enhancedPatients = await Promise.all(
    patients.map(async (pat) => {
      // Get the most recent distribution for this patient
      const lastDistribution = await db
        .select({
          distributionDate: sackPatients.distributionDate,
          sackId: sackPatients.sackId
        })
        .from(sackPatients)
        .where(eq(sackPatients.patientId, pat.id))
        .orderBy(desc(sackPatients.distributionDate))
        .limit(1);
      
      // Add the last distribution date to the patient object
      return {
        ...pat,
        lastDistributionDate: lastDistribution.length ? lastDistribution[0].distributionDate : null,
        lastSackId: lastDistribution.length ? lastDistribution[0].sackId : null
      };
    })
  );
  
  res.status(200).json({
    status: "success",
    results: enhancedPatients.length,
    data: { patients: enhancedPatients },
  });
});
exports.getPatient = catchAsync(async (req, res, next) => {
  const patientData = await db
    .select({
      ...patient,
      diseaseName: disease.name,
      cityName: city.name,
    })
    .from(patient)
    .leftJoin(disease, eq(patient.disease, disease.id))
    .leftJoin(city, eq(patient.city, city.id))
    .where(eq(patient.id, req.params.id))
    .limit(1);

  if (!patientData.length) {
    return next(new AppError("No patient found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { patient: patientData[0] },
  });
});

exports.createPatient = catchAsync(async (req, res, next) => {
  // Validate disease exists
  if (req.body.disease) {
    const diseaseExists = await db
      .select()
      .from(disease)
      .where(eq(disease.id, req.body.disease))
      .limit(1);

    if (!diseaseExists.length) {
      return next(new AppError("Disease not found", 404));
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
      return next(new AppError("City not found", 404));
    }
  }
  
  // Generate celiacID if patient has celiac condition but no ID
  if (req.body.celiac && !req.body.celiacID) {
    // create new id with format year-id
    const year = new Date().getFullYear();
    
    // Get all celiac IDs for this year
    const allCeliacIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.celiacID} LIKE ${year + '-%'}`);
    
    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allCeliacIDs) {
      const parts = pat.celiacID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Create the new ID with the next number
    req.body.celiacID = `${year}-${maxNumber + 1}`;
  }
  
  // Generate rehabilitationID if patient needs rehabilitation but no ID
  if (req.body.rehabilitation && !req.body.rehabilitationID) {
    const year = new Date().getFullYear();
    
    // Get all rehabilitation IDs for this year
    const allRehabIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.rehabilitationID} LIKE ${year + '-%'}`);
    
    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allRehabIDs) {
      const parts = pat.rehabilitationID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Create the new ID with the next number
    req.body.rehabilitationID = `${year}-${maxNumber + 1}`;
  }
  
  // Generate disabledID if patient is disabled but no ID
  if (req.body.isDisabled && !req.body.disabledID) {
    const year = new Date().getFullYear();
    
    // Get all disabled IDs for this year
    const allDisabledIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.disabledID} LIKE ${year + '-%'}`);
    
    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allDisabledIDs) {
      const parts = pat.disabledID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Create the new ID with the next number
    req.body.disabledID = `${year}-${maxNumber + 1}`;
  }
  
  // Generate sickID if patient is sick but no ID
  if (req.body.sick && !req.body.sickID) {
    const year = new Date().getFullYear();
    
    // Get all sick IDs for this year
    const allSickIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.sickID} LIKE ${year + '-%'}`);
    
    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allSickIDs) {
      const parts = pat.sickID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Create the new ID with the next number
    req.body.sickID = `${year}-${maxNumber + 1}`;
  }

  const newPatient = await db.insert(patient).values(req.body).returning();

  res.status(201).json({
    status: "success",
    data: { patient: newPatient[0] },
  });
});

exports.updatePatient = catchAsync(async (req, res, next) => {
  const patient= await db
    .select()
    .from(patient)
    .where(eq(patient.id, req.params.id))
    .limit(1);

  if (!patient.length) {
    return next(new AppError("No patient found with that ID", 404));
  }

  if (req.body.disease) {
    // Validate disease exists
    const diseaseExists = await db
      .select()
      .from(disease)
      .where(eq(disease.id, req.body.disease))
      .limit(1);

    if (!diseaseExists.length) {
      return next(new AppError("Disease not found", 404));
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
      return next(new AppError("City not found", 404));
    }
  }
  if(!patient[0].celiac && req.body.celiac && !req.body.celiacID) {
    const year = new Date().getFullYear();
    
    // Get all sick IDs for this year
    const allSickIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.sickID} LIKE ${year + '-%'}`);
    
    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allSickIDs) {
      const parts = pat.sickID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Create the new ID with the next number
    req.body.sickID = `${year}-${maxNumber + 1}`;
  }
  if(!patient[0].rehabilitation && req.body.rehabilitation && !req.body.rehabilitationID) {
    const year = new Date().getFullYear();

    // Get all rehabilitation IDs for this year
    const allRehabilitationIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.rehabilitationID} LIKE ${year + '-%'}`);

    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allRehabilitationIDs) {
      const parts = pat.rehabilitationID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // Create the new ID with the next number
    req.body.rehabilitationID = `${year}-${maxNumber + 1}`;
  }
  if(!patient[0].isDisabled && req.body.isDisabled && !req.body.disabledID) {
    const year = new Date().getFullYear();
    
    // Get all disabled IDs for this year
    const allDisabledIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.disabledID} LIKE ${year + '-%'}`);
    
    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allDisabledIDs) {
      const parts = pat.disabledID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Create the new ID with the next number
    req.body.disabledID = `${year}-${maxNumber + 1}`;
  }
  if(!patient[0].sick && req.body.sick && !req.body.sickID) {
    const year = new Date().getFullYear();
    // Get all sick IDs for this year
    const allSickIDs = await db
      .select()
      .from(patient)
      .where(sql`${patient.sickID} LIKE ${year + '-%'}`);

    // Find the max number by parsing all IDs
    let maxNumber = 0;
    for (const pat of allSickIDs) {
      const parts = pat.sickID.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // Create the new ID with the next number
    req.body.sickID = `${year}-${maxNumber + 1}`;
  }
  const updatedPatient = await db
    .update(patient)
    .set(req.body)
    .where(eq(patient.id, req.params.id))
    .returning();

  if (!updatedPatient.length) {
    return next(new AppError("No patient found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { patient: updatedPatient[0] },
  });
});

exports.deletePatient = catchAsync(async (req, res, next) => {
  const deletedPatient = await db
    .update(patient)
    .set({ active: false })
    .where(eq(patient.id, req.params.id))
    .returning();
  if (!deletedPatient.length) {
    return next(new AppError("No patient found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
