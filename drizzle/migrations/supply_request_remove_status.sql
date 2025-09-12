-- Drop status column from supply_request table
ALTER TABLE supply_request DROP COLUMN IF EXISTS status;
