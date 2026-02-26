const { integer, pgTable, varchar, pgEnum, serial, time, boolean, date, doublePrecision, check, jsonb, timestamp} = require("drizzle-orm/pg-core");
const { sql, eq, gte, desc } = require("drizzle-orm");


// Define the enum types
const RoleEnums = pgEnum("role", ["admin","worker"]);

// Define the tables
const User = pgTable("User", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  username: varchar( { length: 256 }).notNull().unique(),
  password: varchar( { length: 256 }).notNull(),
  phoneNumber: varchar( { length: 15 }),
  role: RoleEnums().notNull(), 
});

const Donor = pgTable("donor", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  phoneNumber: varchar( { length: 15 }),
  nin: varchar( { length: 20 }).unique(),
  createdAt: time().defaultNow(),
  updatedAt: time().defaultNow(),
});

const disease = pgTable("disease", {
  id: serial().primaryKey(),
  name: varchar( { length: 256 }).notNull(),
});
const city = pgTable("city", {
  id: serial().primaryKey(),
  name: varchar( { length: 256 }).notNull(),
});

const patient = pgTable("patient", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  dateOfBirth: date().notNull(),
  phoneNumber: varchar( { length: 15 }),
  address: varchar( { length: 512 }),
  disease: integer("disease_id")
    .references(() => disease.id, { onDelete: "cascade" }),
  createdAt: time().defaultNow(),
  updatedAt: time().defaultNow(),
  civilStatus: varchar( { length: 50 }),
  city : integer("city_id")
    .references(() => city.id, { onDelete: "cascade" }),
  nin: varchar( { length: 20 }).unique(),
  fatherName: varchar( { length: 256 }),
  numberofChildren: integer().notNull().default(0),
  celiac:boolean().notNull(),
  rehabilitation:boolean().notNull(),
  isDisabled:boolean().notNull(),
  sick:boolean().notNull(),
  celiacID: varchar( { length: 20 }).unique(),
  rehabilitationID: varchar( { length: 20 }).unique(),
  disabledID: varchar( { length: 20 }).unique(),
  sickID: varchar( { length: 20 }).unique(),
  coucheType: varchar( { length: 50 }),
  active: boolean().notNull().default(true),
  deceased: boolean().notNull().default(false),
});

// Patient files table for storing uploaded documents
const patientFiles = pgTable("patient_files", {
  id: serial().primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  fileName: varchar( { length: 256 }).notNull(),
  originalName: varchar( { length: 256 }).notNull(),
  fileType: varchar( { length: 100 }).notNull(),
  fileSize: integer().notNull(),
  filePath: varchar( { length: 512 }).notNull(),
  uploadDate: timestamp().defaultNow(),
  description: varchar( { length: 512 }),
  fileCategory: varchar( { length: 100 }), // e.g., "medical", "id", "application", etc.
});

const products= pgTable("product",{
  id: serial().primaryKey(),
  productName: varchar( { length: 256 }).notNull(),
  description: varchar( { length: 512 }),
  type: varchar( { length: 256 }).notNull(),
  quantity: integer().notNull().default(0),
  barcode: varchar( { length: 100 }).unique()
})


const stock = pgTable("stock", {
  id: serial().primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer().notNull(),
  date: date().notNull(),
  unitPrice: doublePrecision().notNull(),
});

const DonationType=pgEnum("donation_type",["zakat","sadaqa","other"]);

const Donation = pgTable("donation", {
  id: serial().primaryKey(),
  donorId: integer("donor_id")
    .notNull()
    .references(() => Donor.id, { onDelete: "cascade" }),
  amount: doublePrecision().notNull(),
  date: timestamp().defaultNow(),
  type: DonationType().notNull(),
  usedAmount: doublePrecision().notNull().default(0),
},(table)=>[
  check("usedAmount",gte(table.amount,table.usedAmount))
]
);

const DonationStock = pgTable("donation_stock", {
  id: serial().primaryKey(),
  donationId: integer("donation_id")
    .notNull()
    .references(() => Donation.id, { onDelete: "cascade" }),
  stockId: integer("stock_id")
    .notNull()
    .references(() => stock.id, { onDelete: "cascade" }),
  amount: integer().notNull(),
  createdAt: timestamp().defaultNow()
});



const distributors = pgTable("distributors", {
  id: serial().primaryKey(),
  name: varchar( { length: 256 }).notNull(),
  address: varchar( { length: 512 }),
  phoneNumber: varchar( { length: 15 }),
  phoneNumber2: varchar( { length: 15 }),
  phoneNumber3: varchar( { length: 15 }),
  email: varchar( { length: 256 }),
});

const receipt = pgTable("receipt", {
  id: serial().primaryKey(),
  receiptId: varchar( { length: 20 }).notNull().unique(),
  patientId: integer("patient_id")
    .references(() => patient.id, { onDelete: "cascade" }),
  partnerInfo: varchar( { length: 512 }),
  date: date().notNull(),
  type: varchar( { length: 50 }).notNull(),
  amount: doublePrecision(),
  amountCovered: doublePrecision(),
  amountByPatient: doublePrecision(),
  paid: boolean().notNull().default(false),
  paidBy: varchar( { length: 256 }),
  partnerId: integer("partner_id")
    .references(() => partner.id, { onDelete: "cascade" }),
});
const receiptDonations = pgTable("receipt_donations", {
  id: serial().primaryKey(),
  receiptId: integer("receipt_id")
    .notNull()
    .references(() => receipt.id, { onDelete: "cascade" }),
  donationId: integer("donation_id")
    .notNull()
    .references(() => Donation.id, { onDelete: "cascade" }),
  amount: doublePrecision().notNull(),
  createdAt: timestamp().defaultNow()
});

const partner = pgTable("partner", {
  id: serial().primaryKey(),
  type:varchar( { length: 512 }).notNull(),
  name: varchar( { length: 512 }).notNull(),
  address: varchar( { length: 512 }),
  phoneNumber: varchar( { length: 15 }),
  phoneNumber2: varchar( { length: 15 }),
  phoneNumber3: varchar( { length: 15 }),
  email: varchar( { length: 256 }),
  isActive: boolean().notNull().default(true),
});

const materialTypes = pgTable("material_types", {
  id: serial().primaryKey(),
  name: varchar( { length: 256 }).notNull(),
});

const statusEnum = pgEnum("status", ["available", "unavailable","lost"]);
const material = pgTable("material", {
  id: serial().primaryKey(),
  inventory_number: varchar( { length: 50 }).notNull(),
  typeId: integer("type_id")
    .notNull()
    .references(() => materialTypes.id, { onDelete: "cascade" }),
  registration_date: date().notNull(),
  price: doublePrecision().notNull(),
  notes: varchar( { length: 512 }),
  status: statusEnum().notNull().default("available"),
});


const materialDonations = pgTable("material_donations", {
  id: serial().primaryKey(),
  materialId: integer("material_id")
    .notNull()
    .references(() => material.id, { onDelete: "cascade" }),
  donationId: integer("donation_id")
    .notNull()
    .references(() => Donation.id, { onDelete: "cascade" }),
  amount: doublePrecision().notNull(),
  createdAt: timestamp().defaultNow()
  
});
const loanStatusEnum = pgEnum("loan_status", ["active", "returned"]);

const materialLoans = pgTable("material_loans", {
  id: serial().primaryKey(),
  materialId: integer("material_id")
    .notNull()
    .references(() => material.id, { onDelete: "cascade" }),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  loanDate: date().notNull(),
  returnDate: date().notNull(),
  lenderId: integer("lender_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  status: loanStatusEnum().notNull().default("active"),
  delivererName: varchar( { length: 256 }).notNull(),
  delivererNIN: varchar( { length: 20 }).notNull(),
  delivererPhone: varchar( { length: 15 }).notNull(),
});

const sack = pgTable("sack", {
  id: serial().primaryKey(),
  name: varchar({ length: 256 }).notNull(),
});

const sackProducts = pgTable("sack_products", {
  id: serial().primaryKey(),
  sackId: integer("sack_id")
    .notNull()
    .references(() => sack.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer().notNull(),
});
const sackPatients = pgTable("sack_patients", {
  id: serial().primaryKey(),
  sackId: integer("sack_id")
    .notNull()
    .references(() => sack.id, { onDelete: "cascade" }),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  quantity: integer().notNull(),
  distributionDate: date().notNull(),
  distributedBy: integer("distributed_by")
    .notNull()
    .references(() => distributors.id, { onDelete: "cascade" }),
  productsSnapshot: jsonb(), // Stores the product array directly
});

const supplyRequest = pgTable("supply_request", {
  id: serial().primaryKey(),
  supplyRequestId: varchar({ length: 20 }).notNull().unique(),
  type: varchar({ length: 50 }).notNull(), // Can be 'product', 'material', or 'mixed'
  source: varchar({ length: 256 }),
  notes: varchar({ length: 512 }),
  requestDate: date().notNull(),
});

// Junction table for supply requests and products
const supplyRequestProducts = pgTable("supply_request_products", {
  id: serial().primaryKey(),
  supplyRequestId: integer().references(() => supplyRequest.id, { onDelete: 'cascade' }).notNull(),
  productId: integer().references(() => products.id).notNull(),
  quantity: integer().notNull().default(1),
  notes: varchar({ length: 512 }),
});

// Junction table for supply requests and materials
const supplyRequestMaterials = pgTable("supply_request_materials", {
  id: serial().primaryKey(),
  supplyRequestId: integer().references(() => supplyRequest.id, { onDelete: 'cascade' }).notNull(),
  materialId: integer().references(() => materialTypes.id).notNull(),
  quantity: integer().notNull().default(1),
  notes: varchar({ length: 512 }),
});

module.exports = {
  RoleEnums,
  User,
  Donor,
  disease,
  city,
  patient,
  patientFiles,
  products,
  stock,
  DonationType,
  Donation,
  DonationStock,
  distributors,
  receipt,
  receiptDonations,
  partner,
  materialTypes,
  statusEnum,
  material,
  materialDonations,
  loanStatusEnum,
  materialLoans,
  sack,
  sackProducts,
  sackPatients,
  supplyRequest,
  supplyRequestProducts,
  supplyRequestMaterials,
};
