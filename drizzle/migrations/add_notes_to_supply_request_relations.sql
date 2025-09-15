-- Add notes column to supply_request_products
ALTER TABLE supply_request_products
ADD COLUMN notes VARCHAR(512);

-- Add notes column to supply_request_materials
ALTER TABLE supply_request_materials
ADD COLUMN notes VARCHAR(512);