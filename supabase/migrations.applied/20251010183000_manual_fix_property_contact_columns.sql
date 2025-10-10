-- MANUAL FIX APPLIED TO PRODUCTION ON 2025-10-10
-- This documents the manual SQL commands that were run directly in Supabase SQL Editor
-- to fix missing PropertyContact columns that were causing API errors

-- Problem: Production API was failing with errors like:
-- "PropertyContact.spokenLanguage does not exist in the current database"
-- "PropertyContact.isContractSignatory does not exist in the current database"

-- Root Cause: Schema drift between Prisma schema definition and actual database
-- The Prisma schema had these fields but they were never migrated to production

-- MANUAL COMMANDS RUN IN PRODUCTION:
-- (These commands were executed directly in Supabase SQL Editor)

-- Add spokenLanguage column
ALTER TABLE "PropertyContact" ADD COLUMN "spokenLanguage" TEXT DEFAULT 'English';

-- Add isContractSignatory column  
ALTER TABLE "PropertyContact" ADD COLUMN "isContractSignatory" BOOLEAN NOT NULL DEFAULT false;

-- Update any existing NULL values (if any)
UPDATE "PropertyContact" SET "spokenLanguage" = 'English' WHERE "spokenLanguage" IS NULL;

-- NOTES:
-- - This was an emergency fix to resolve production API errors
-- - Future schema changes should follow proper Supabase migration workflow
-- - This file documents the manual changes for audit trail
-- - Preview branches may still need these columns added via proper migrations