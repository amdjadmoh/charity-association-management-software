require("dotenv").config();
const { defineConfig } = require("drizzle-kit");

export default defineConfig({
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DB_CONNECTION_STRING,
  },
  dialect: "postgresql"
});