CREATE TABLE IF NOT EXISTS "patient_files" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "file_name" VARCHAR(256) NOT NULL,
  "original_name" VARCHAR(256) NOT NULL,
  "file_type" VARCHAR(100) NOT NULL,
  "file_size" INTEGER NOT NULL,
  "file_path" VARCHAR(512) NOT NULL,
  "upload_date" TIMESTAMP DEFAULT NOW(),
  "description" VARCHAR(512),
  "file_category" VARCHAR(100)
);
