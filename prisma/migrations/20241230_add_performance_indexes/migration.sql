-- Add indexes for frequently filtered fields to improve query performance

-- Create GIN indexes for JSON fields that are frequently filtered
CREATE INDEX IF NOT EXISTS "Property_services_idx" ON "Property" USING GIN ("services");
CREATE INDEX IF NOT EXISTS "Property_accessibility_idx" ON "Property" USING GIN ("accessibility");
CREATE INDEX IF NOT EXISTS "Property_policies_idx" ON "Property" USING GIN ("policies");
CREATE INDEX IF NOT EXISTS "Property_arrivalDeparture_idx" ON "Property" USING GIN ("arrivalDeparture");

-- Add composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS "Property_status_destinationId_idx" ON "Property" ("status", "destinationId");
CREATE INDEX IF NOT EXISTS "Property_numberOfRooms_numberOfBathrooms_idx" ON "Property" ("numberOfRooms", "numberOfBathrooms");
CREATE INDEX IF NOT EXISTS "Property_maxGuests_idx" ON "Property" ("maxGuests");

-- Add indexes for boolean fields that are frequently filtered
CREATE INDEX IF NOT EXISTS "Property_eventsAllowed_idx" ON "Property" ("eventsAllowed");
CREATE INDEX IF NOT EXISTS "Property_onlineReservation_idx" ON "Property" ("onlineReservation");
CREATE INDEX IF NOT EXISTS "Property_flexibleCancellation_idx" ON "Property" ("flexibleCancellation");
CREATE INDEX IF NOT EXISTS "Property_exclusivity_idx" ON "Property" ("exclusivity");
CREATE INDEX IF NOT EXISTS "Property_iconicCollection_idx" ON "Property" ("iconicCollection");

-- Add partial index for published properties (most common filter)
CREATE INDEX IF NOT EXISTS "Property_published_idx" ON "Property" ("status") WHERE "status" = 'PUBLISHED';

-- Add full-text search index for property search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Property_name_trgm_idx" ON "Property" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Property_originalName_trgm_idx" ON "Property" USING gin ("originalName" gin_trgm_ops) WHERE "originalName" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Property_address_trgm_idx" ON "Property" USING gin ("address" gin_trgm_ops) WHERE "address" IS NOT NULL;

-- Add indexes for price range queries
CREATE INDEX IF NOT EXISTS "PriceRange_propertyId_nightlyRate_idx" ON "PriceRange" ("propertyId", "nightlyRate");
CREATE INDEX IF NOT EXISTS "PriceRange_startDate_endDate_idx" ON "PriceRange" ("startDate", "endDate");

-- Add index for photo queries
CREATE INDEX IF NOT EXISTS "Photo_propertyId_isMain_idx" ON "Photo" ("propertyId", "isMain");
CREATE INDEX IF NOT EXISTS "Photo_propertyId_position_idx" ON "Photo" ("propertyId", "position");

-- Add indexes for contact queries
CREATE INDEX IF NOT EXISTS "PropertyContact_propertyId_type_idx" ON "PropertyContact" ("propertyId", "type");
CREATE INDEX IF NOT EXISTS "PropertyContact_isApproved_idx" ON "PropertyContact" ("isApproved");

-- Update statistics for the optimizer
ANALYZE "Property";
ANALYZE "PriceRange";
ANALYZE "Photo";
ANALYZE "PropertyContact";