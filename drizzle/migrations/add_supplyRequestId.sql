-- Add supplyRequestId column to supply_request table
ALTER TABLE supply_request ADD COLUMN IF NOT EXISTS "supplyRequestId" VARCHAR(20) UNIQUE;

-- Set existing rows to have a generated supplyRequestId (SR prefix followed by the ID)
UPDATE supply_request SET "supplyRequestId" = 'SR' || LPAD(id::text, 6, '0') WHERE "supplyRequestId" IS NULL;

-- Make the column NOT NULL after populating it
ALTER TABLE supply_request ALTER COLUMN "supplyRequestId" SET NOT NULL;