import { integer, pgTable, varchar, pgEnum, serial, time, boolean, date, doublePrecision, check,} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Define the enum types
export const RoleEnums = pgEnum("role", ["admin","worker"]);

// Define the tables
export const User = pgTable("User", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  username: varchar( { length: 256 }).notNull().unique(),
  password: varchar( { length: 256 }).notNull(),
  phoneNumber: varchar( { length: 15 }).notNull(),
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
  phoneNumber: varchar( { length: 15 }).notNull(),
  address: varchar( { length: 512 }).notNull(),
  disease: integer("disease_id")
    .notNull()
    .references(() => disease.id, { onDelete: "cascade" }),
  createdAt: time().defaultNow(),
  updatedAt: time().defaultNow(),
  civilStatus: varchar( { length: 50 }).notNull(),
  city : integer("city_id")
    .notNull()
    .references(() => city.id, { onDelete: "cascade" }),
  nin: varchar( { length: 20 }).notNull().unique(),
  fatherName: varchar( { length: 256 }).notNull(),
  numberofChildren: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  isDeceased: boolean().notNull().default(false),
  deceasedDate: date()
});




