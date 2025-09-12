-- Convert supply_request table to use relational tables instead of JSONB

-- First, drop the JSONB columns from the main table
ALTER TABLE supply_request DROP COLUMN IF EXISTS productsData;
ALTER TABLE supply_request DROP COLUMN IF EXISTS materialsData;

-- Create the junction tables
CREATE TABLE IF NOT EXISTS supply_request_products (
  id SERIAL PRIMARY KEY,
  supply_request_id INTEGER NOT NULL REFERENCES supply_request(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS supply_request_materials (
  id SERIAL PRIMARY KEY,
  supply_request_id INTEGER NOT NULL REFERENCES supply_request(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES material(id),
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_supply_request_products_supply_request_id ON supply_request_products(supply_request_id);
CREATE INDEX IF NOT EXISTS idx_supply_request_products_product_id ON supply_request_products(product_id);

CREATE INDEX IF NOT EXISTS idx_supply_request_materials_supply_request_id ON supply_request_materials(supply_request_id);
CREATE INDEX IF NOT EXISTS idx_supply_request_materials_material_id ON supply_request_materials(material_id);
