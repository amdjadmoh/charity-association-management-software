import { integer, pgTable, varchar, pgEnum, serial, time, boolean, date, doublePrecision, check,} from "drizzle-orm/pg-core";
import { sql,eq,gte, desc } from "drizzle-orm";
import e from "express";

// Define the enum types
export const RoleEnums = pgEnum("role", ["admin","worker"]);

// Define the tables
export const User = pgTable("User", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  username: varchar( { length: 256 }).notNull().unique(),
  password: varchar( { length: 256 }).notNull(),
  phoneNumber: varchar( { length: 15 }),
  role: RoleEnums().notNull(), 
});

export const Donor = pgTable("donor", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  phoneNumber: varchar( { length: 15 }),
  nin: varchar( { length: 20 }).unique(),
  createdAt: time().defaultNow(),
  updatedAt: time().defaultNow(),
});

export const disease = pgTable("disease", {
  id: serial().primaryKey(),
  name: varchar( { length: 256 }).notNull(),
});
export const city = pgTable("city", {
  id: serial().primaryKey(),
  name: varchar( { length: 256 }).notNull(),
});

export const patient = pgTable("patient", {
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
    .notNull()
    .references(() => city.id, { onDelete: "cascade" }),
  nin: varchar( { length: 20 }).unique(),
  fatherName: varchar( { length: 256 }),
  numberofChildren: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  isDeceased: boolean().notNull().default(false),
  deceasedDate: date()
});

export const products= pgTable("product",{
  id: serial().primaryKey(),
  productName: varchar( { length: 256 }).notNull(),
  description: varchar( { length: 512 }),
  type: varchar( { length: 256 }).notNull(),
  quantity: integer().notNull().default(0),
})


export const stock = pgTable("stock", {
  id: serial().primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer().notNull(),
  createdAt: time().defaultNow(),
  updatedAt: time().defaultNow(),
  unitPrice: doublePrecision().notNull(),
  deleteDate: date().$default(null),
});

export const DonationType=pgEnum("donation_type",["zakat","sadaqa","other"]);

export const Donation = pgTable("donation", {
  id: serial().primaryKey(),
  donorId: integer("donor_id")
    .notNull()
    .references(() => Donor.id, { onDelete: "cascade" }),
  amount: doublePrecision().notNull(),
  date: date().notNull(),
  type: DonationType().notNull(),
  usedAmount: doublePrecision().notNull().default(0),
},(table)=>[
  check("usedAmount",gte(table.amount,table.usedAmount))
]
);







  






