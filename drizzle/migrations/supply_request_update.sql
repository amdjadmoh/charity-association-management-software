-- Drop the old table structure
DROP TABLE IF EXISTS "supply_request";

-- Create the new table with JSONB fields for multiple products and materials
CREATE TABLE "supply_request" (
  "id" SERIAL PRIMARY KEY,
  "type" VARCHAR(50) NOT NULL,
  "products_data" JSONB,
  "materials_data" JSONB,
  "source" VARCHAR(256),
  "notes" VARCHAR(512),
  "request_date" DATE NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending'
);
