CREATE TABLE IF NOT EXISTS "sack_distribution_snapshot" (
  "id" serial PRIMARY KEY,
  "distribution_id" integer REFERENCES "sack_patients"("id"),
  "product_id" integer REFERENCES "products"("id"),
  "product_name" varchar(256),
  "quantity" integer
);

-- Add productsSnapshot column to sack_patients if it doesn't exist
ALTER TABLE "sack_patients" ADD COLUMN IF NOT EXISTS "products_snapshot" jsonb;
