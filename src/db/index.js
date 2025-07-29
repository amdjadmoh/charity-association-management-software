require("dotenv").config();
const { drizzle } = require("drizzle-orm/node-postgres");

const db = drizzle(process.env.DB_CONNECTION_STRING);

module.exports = { db };