-- Add columns only if they don't exist (handles both new and existing schemas)
DO $$
BEGIN
    -- Add firstName column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='PropertyContact' AND column_name='firstName') THEN
        ALTER TABLE "PropertyContact" ADD COLUMN "firstName" TEXT;
    END IF;
    
    -- Add lastName column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='PropertyContact' AND column_name='lastName') THEN
        ALTER TABLE "PropertyContact" ADD COLUMN "lastName" TEXT;
    END IF;
END $$;

-- Update existing data by splitting name field (only if records exist)
-- This handles both empty databases (preview branches) and populated databases (production)
DO $$
BEGIN
    -- Only update if table has data
    IF EXISTS (SELECT 1 FROM "PropertyContact" LIMIT 1) THEN
        UPDATE "PropertyContact" 
        SET 
          "firstName" = SPLIT_PART("name", ' ', 1),
          "lastName" = CASE 
            WHEN LENGTH(TRIM("name")) - LENGTH(REPLACE("name", ' ', '')) >= 1 
            THEN TRIM(SUBSTRING("name" FROM POSITION(' ' IN "name") + 1))
            ELSE ''
          END
        WHERE "firstName" IS NULL AND "name" IS NOT NULL;
    END IF;
END $$;