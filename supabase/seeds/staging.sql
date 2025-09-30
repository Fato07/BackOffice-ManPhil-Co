-- Staging environment seed data
-- This file contains sample data for testing in the staging environment

-- Insert sample global contacts for staging
INSERT INTO "public"."GlobalContact" (id, email, "firstName", "lastName", phone, mobile, company, notes, category, address, "createdAt", "updatedAt") VALUES
('clz8x1234567890abcdef', 'test.owner@staging.com', 'Test', 'Owner', '+33123456789', '+33612345678', 'Staging Properties Ltd', 'Test owner for staging', 'OWNER', '{"street": "123 Test St", "city": "Paris", "country": "France", "postalCode": "75001"}', NOW(), NOW()),
('clz8x2345678901bcdefg', 'test.manager@staging.com', 'Test', 'Manager', '+33223456789', '+33622345678', 'Staging Management Co', 'Test manager for staging', 'PROVIDER', '{"street": "456 Demo Ave", "city": "Lyon", "country": "France", "postalCode": "69001"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample property for staging
INSERT INTO "public"."Property" (id, "publicId", "internalName", description, headline, "propertyType", bedrooms, bathrooms, "toiletRooms", "sleepingCapacity", "professionalCapacity", "minNights", "defaultCheckInTime", "defaultCheckOutTime", "keyReceptionLocation", "internetSpeed", size, "sizeUnit", "depositRequirement", "cleaningFeeAmount", "conciergeService", city, state, region, country, "countryCode", latitude, longitude, timezone, "rentalLicense", "publicFeatures", "marketingFeatures", "propertyManagerId", "cleaningFeePayableTo", "primaryContactId", "secondaryContactId", status, currency, "defaultLocale", "supportedLocales", "createdAt", "updatedAt") VALUES
('clz8xtest1234567890ab', 'STAG-001', 'Staging Test Villa', 'Beautiful test property for staging environment', 'Luxury Test Villa in Staging', 'villa', 5, 4, 2, 10, 12, 3, '16:00', '10:00', 'Reception desk at main entrance', 100, 350, 'sqm', 5000, 500, 'LUXURY', 'Paris', 'Île-de-France', 'Paris Region', 'France', 'FR', 48.8566, 2.3522, 'Europe/Paris', 'STG-LICENSE-001', '["Swimming Pool", "Garden", "Parking"]'::jsonb, '["Luxury", "Family Friendly", "Pet Friendly"]'::jsonb, 'clz8x2345678901bcdefg', 'MANAGER', 'clz8x1234567890abcdef', NULL, 'PUBLISHED', 'EUR', 'en', '["en", "fr"]', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample rooms for the staging property
INSERT INTO "public"."Room" (id, "propertyId", name, type, description, "order", floor, size, "sizeUnit", "maxOccupancy", "accessibilityFeatures", images, "createdAt", "updatedAt") VALUES
('clz8xroom1234567890ab', 'clz8xtest1234567890ab', 'Master Bedroom', 'BEDROOM', 'Spacious master bedroom with en-suite bathroom', 1, 1, 40, 'sqm', 2, '[]'::jsonb, '[]'::jsonb, NOW(), NOW()),
('clz8xroom2345678901bc', 'clz8xtest1234567890ab', 'Living Room', 'LIVING_ROOM', 'Large living room with fireplace', 2, 0, 60, 'sqm', 10, '[]'::jsonb, '[]'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample property contacts for staging
INSERT INTO "public"."PropertyContact" (id, "propertyId", "contactId", type, role, notes, permissions, "isActive", "isPrimary", metadata, "createdAt", "updatedAt") VALUES
('clz8xpc1234567890abcd', 'clz8xtest1234567890ab', 'clz8x1234567890abcdef', 'OWNER', 'Primary Owner', 'Main property owner for staging', '{"canApprove": true, "canAccess": true}'::jsonb, true, true, '{}'::jsonb, NOW(), NOW()),
('clz8xpc2345678901bcde', 'clz8xtest1234567890ab', 'clz8x2345678901bcdefg', 'MANAGER', 'Property Manager', 'Manages day-to-day operations', '{"canApprove": false, "canAccess": true}'::jsonb, true, false, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: This is sample data for staging environment testing
-- Do not use in production