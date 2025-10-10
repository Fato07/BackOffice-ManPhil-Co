-- AddColumn
ALTER TABLE "PropertyContact" ADD COLUMN "firstName" TEXT;
ALTER TABLE "PropertyContact" ADD COLUMN "lastName" TEXT;

-- Update existing data by splitting name field
UPDATE "PropertyContact" 
SET 
  "firstName" = SPLIT_PART("name", ' ', 1),
  "lastName" = CASE 
    WHEN LENGTH(TRIM("name")) - LENGTH(REPLACE("name", ' ', '')) >= 1 
    THEN TRIM(SUBSTRING("name" FROM POSITION(' ' IN "name") + 1))
    ELSE ''
  END
WHERE "firstName" IS NULL;