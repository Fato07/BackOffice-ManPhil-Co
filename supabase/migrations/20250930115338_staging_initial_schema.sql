-- Initial schema migration for staging environment
-- Generated from Prisma schema
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'ONBOARDING', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "public"."LicenseType" AS ENUM ('NOT_APPLICABLE', 'TYPE_1', 'TYPE_2');

-- CreateEnum
CREATE TYPE "public"."ConciergeServiceOffer" AS ENUM ('ESSENTIAL', 'PREMIUM', 'LUXURY');

-- CreateEnum
CREATE TYPE "public"."ContactType" AS ENUM ('OWNER', 'MANAGER', 'AGENCY', 'STAFF', 'MAINTENANCE', 'EMERGENCY', 'CHECK_IN_MANAGER', 'SECURITY_DEPOSIT_MANAGER', 'SIGNATORY', 'HOUSEKEEPING', 'GARDENING', 'POOL_MAINTENANCE', 'CHECK_IN_STAFF');

-- CreateEnum
CREATE TYPE "public"."GlobalContactCategory" AS ENUM ('CLIENT', 'OWNER', 'PROVIDER', 'ORGANIZATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ContactPropertyRelationship" AS ENUM ('OWNER', 'RENTER', 'MANAGER', 'STAFF', 'EMERGENCY', 'MAINTENANCE', 'AGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BookingType" AS ENUM ('CONFIRMED', 'TENTATIVE', 'BLOCKED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."EquipmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EquipmentRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."LegalDocumentCategory" AS ENUM ('PROPERTY_DEED', 'LEASE_AGREEMENT', 'VENDOR_CONTRACT', 'INSURANCE_POLICY', 'PERMIT_LICENSE', 'TAX_DOCUMENT', 'COMPLIANCE_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LegalDocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."RoomType" AS ENUM ('BADMINTON_COURT', 'BAR', 'BASKETBALL_COURT', 'BATHROOM', 'BEDROOM', 'BEDROOM_FOR_CHILDREN', 'BEDROOM_FOR_STAFF', 'BILLBOARD_ROOM', 'CIGAR_CELL', 'COLD_CHAMBER', 'CONFERENCE_ROOM', 'COURTYARD', 'COVERED_TERRACE', 'DINING_ROOM', 'DORMITORY', 'DRESSING_ROOM', 'FITNESS_ROOM', 'FOOTBALL_COURT', 'GAMING_ROOM', 'GARDEN', 'KITCHEN', 'LAUNDRY_ROOM', 'LIVING_ROOM', 'MASSAGE_ROOM', 'MEDITATION_ROOM', 'MOVIE_ROOM', 'MUSIC_ROOM', 'OFFICE_ROOM', 'PADEL_COURT', 'PETANQUE', 'POOL_AREA', 'POOLHOUSE', 'RELAXATION_ROOM', 'RESTROOM', 'ROOFTOP', 'SKIROOM', 'SLEEPING_SLUG', 'SMOKEHOUSE', 'SPA', 'SUITE', 'TENNIS_COURT', 'TERRACE', 'TV_ROOM', 'VIP', 'VERANDA', 'VOLLEYBALL_COURT', 'WINDOWLESS_BEDROOM', 'WINE_CELLAR');

-- CreateEnum
CREATE TYPE "public"."EquipmentType" AS ENUM ('CEILING_FAN', 'SOFA', 'PUTTING_GREEN', 'WINE_CELLAR', 'DOUBLE_SUNBED', 'SODASTREAM', 'DISHWASHER', 'GAS_COOKER', 'INDUCTION_HOB', 'SKI_RACKS', 'SLEDGE', 'SHARED_TERRACE', 'SWING', 'TREE_HOUSE', 'SEESAW', 'CHESS_BOARD', 'BOARD_GAMES', 'DJ_SET', 'POPCORN_MACHINE', 'KITCHENETTE', 'TREADMILL', 'CYCLE', 'ROWING_MACHINE', 'DUMBBELLS', 'WAFFLE_MACHINE', 'FOUNTAIN', 'POND', 'FIRE_PIT', 'SINGLE_BASIN_SINK', 'DOUBLE_BASIN_SINK', 'MASSAGE_TABLE', 'OBSERVATORY', 'VEGETABLE_GARDEN', 'CROQUET', 'CRICKET_PITCH', 'PARASOL', 'VINEYARD', 'JACUZZI_BATHTUB', 'FIREPLACE', 'NORDIC_BATH', 'CHAIR', 'DVD_PLAYER', 'JACK_CABLE', 'WINE_GLASS', 'GRILL', 'TOILET', 'RACLETTE_MACHINE', 'FONDUE_MACHINE', 'SOUND_SYSTEM', 'MOORING', 'DOUBLE_BED', 'BEAN_TO_CUP_COFFEE_MACHINE', 'PIER', 'COFFEE_POD_MACHINE', 'BAR_EQUIPMENT', 'BATHTUB', 'OUTDOOR_SHOWER', 'HAMMOCK', 'SOLARIUM', 'CHILDREN_POOL', 'MAGNIFYING_MIRROR', 'TOILET_NOT_IN_BATHROOM', 'ACCESSIBLE_TOILETS', 'MICROWAVE_OVEN', 'PROFESSIONAL_OVEN', 'PIZZA_OVEN', 'SUNBED', 'DELI_SLICER', 'DOUBLE_BED_TWIN_BEDS', 'HAMMAM_SHOWER', 'TELEPHONE', 'STORAGE_CUPBOARD', 'DVD_LIBRARY', 'GAMING_CONSOLE', 'DARTS_SET', 'STEAMER', 'CHILDREN_GAMES', 'HEATED_BOOT_WARMER', 'REVERSIBLE_AIR_CONDITIONING', 'TOASTER', 'FILTER_COFFEE_MACHINE', 'KETTLE', 'JUICER', 'BLENDER_MIXER', 'DISHWASHER_EQUIPMENT', 'TURNTABLE', 'FITNESS_EQUIPMENT', 'SINGLE_BED', 'COMPUTER', 'PRINTER', 'SCANNER', 'SAUNA', 'TRAMPOLINE', 'SOFA_BED', 'AIR_CONDITIONING', 'JACUZZI', 'BARBECUE', 'HAMMAM', 'TABLE_FOOTBALL', 'TUMBLE_DRYER', 'KITCHEN_ISLAND', 'WASHING_MACHINE', 'RANGE_HOOD', 'TERRACE_EQUIPMENT', 'PING_PONG_TABLE', 'SWIMMING_POOL', 'SHOWER', 'IRON', 'IRONING_BOARD', 'DESK', 'BILLIARD_TABLE', 'FRIDGE', 'AMERICAN_FRIDGE', 'FREEZER', 'ICE_CUBE_MAKER', 'ICE_CREAM_SORBET_MACHINE', 'OVEN', 'WALK_IN_SHOWER', 'SANDWICH_MAKER', 'THERMOMIX', 'BEER_TAP', 'DEEP_FRYER', 'RICE_COOKER', 'GLOVE_DRYERS', 'BUNK_BEDS', 'COLD_WATER_BATH', 'SOFA_EQUIPMENT', 'CHILDREN_SLIDE', 'CHILDREN_PLAYHOUSE', 'COMBINED_GAS_INDUCTION_STOVE', 'TENT', 'BERBER_TENT', 'FAN', 'CHAMPAGNE_GLASS', 'ARMCHAIR', 'SMART_TV', 'FLAT_SCREEN_TV', 'TV', 'SOFA_BED_SINGLE', 'VIDEO_PROJECTOR', 'PIANO', 'SAFE', 'WALK_IN_CLOSET', 'FOOD_PROCESSOR', 'PERGOLA', 'HELIPAD', 'LIBRARY');

-- CreateEnum
CREATE TYPE "public"."AccessibilityType" AS ENUM ('BY_CAR', 'SKI_IN_SKI_OUT', 'BY_FOOT');

-- CreateEnum
CREATE TYPE "public"."BookingCondition" AS ENUM ('PER_NIGHT', 'WEEKLY_SATURDAY_TO_SATURDAY', 'WEEKLY_SUNDAY_TO_SUNDAY', 'WEEKLY_MONDAY_TO_MONDAY');

-- CreateEnum
CREATE TYPE "public"."OperationalCostType" AS ENUM ('HOUSEKEEPING', 'HOUSEKEEPING_AT_CHECKOUT', 'LINEN_CHANGE', 'OPERATIONAL_PACKAGE');

-- CreateEnum
CREATE TYPE "public"."PriceType" AS ENUM ('PER_STAY', 'PER_WEEK', 'PER_DAY', 'FIXED');

-- CreateTable
CREATE TABLE "public"."Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "imageUrl" TEXT,
    "imageAltText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'ONBOARDING',
    "destinationId" TEXT NOT NULL,
    "numberOfRooms" INTEGER NOT NULL DEFAULT 0,
    "numberOfBathrooms" INTEGER NOT NULL DEFAULT 0,
    "maxGuests" INTEGER NOT NULL DEFAULT 0,
    "propertySize" DOUBLE PRECISION,
    "address" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "additionalDetails" TEXT,
    "licenseType" "public"."LicenseType" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "conciergeServiceOffer" "public"."ConciergeServiceOffer" NOT NULL DEFAULT 'ESSENTIAL',
    "categories" TEXT[],
    "operatedByExternal" TEXT,
    "exclusivity" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "segment" TEXT,
    "iconicCollection" BOOLEAN NOT NULL DEFAULT false,
    "onboardingFees" BOOLEAN NOT NULL DEFAULT false,
    "onlineReservation" BOOLEAN NOT NULL DEFAULT true,
    "flexibleCancellation" BOOLEAN NOT NULL DEFAULT false,
    "neighborhood" TEXT,
    "setting" TEXT,
    "specialAttention" TEXT,
    "locatedInCity" BOOLEAN NOT NULL DEFAULT false,
    "beachAccess" BOOLEAN NOT NULL DEFAULT false,
    "beachAccessibility" TEXT,
    "beachTravelTime" TEXT,
    "privateBeachAccess" BOOLEAN NOT NULL DEFAULT false,
    "skiSlopes" BOOLEAN NOT NULL DEFAULT false,
    "shops" BOOLEAN NOT NULL DEFAULT false,
    "restaurants" BOOLEAN NOT NULL DEFAULT false,
    "touristCenter" BOOLEAN NOT NULL DEFAULT false,
    "golfCourse" BOOLEAN NOT NULL DEFAULT false,
    "accessibility" JSONB,
    "accessibilityOptions" "public"."AccessibilityType"[],
    "policies" JSONB,
    "arrivalDeparture" JSONB,
    "staff" JSONB,
    "heatingAC" JSONB,
    "eventsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "eventsCapacity" INTEGER,
    "eventsDetails" JSONB,
    "services" JSONB,
    "description" JSONB,
    "parking" JSONB,
    "goodToKnow" TEXT,
    "internalComment" TEXT,
    "warning" TEXT,
    "automaticOffer" JSONB,
    "surroundings" JSONB,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "checkInPerson" TEXT,
    "wifiName" TEXT,
    "wifiPassword" TEXT,
    "wifiInAllRooms" BOOLEAN NOT NULL DEFAULT false,
    "wifiSpeed" TEXT,
    "mobileNetworkCoverage" TEXT,
    "hasFireExtinguisher" BOOLEAN NOT NULL DEFAULT false,
    "hasFireAlarm" BOOLEAN NOT NULL DEFAULT false,
    "electricMeterAccessible" BOOLEAN NOT NULL DEFAULT false,
    "electricMeterLocation" TEXT,
    "stayMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."RoomType" NOT NULL,
    "groupName" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "generalInfo" JSONB,
    "view" TEXT,
    "equipment" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyContact" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "public"."ContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "public"."BookingType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "numberOfGuests" INTEGER,
    "notes" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceRange" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "nightlyRate" DOUBLE PRECISION,
    "weeklyRate" DOUBLE PRECISION,
    "monthlyRate" DOUBLE PRECISION,
    "ownerNightlyRate" DOUBLE PRECISION,
    "ownerWeeklyRate" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    "publicNightlyRate" DOUBLE PRECISION,
    "publicWeeklyRate" DOUBLE PRECISION,
    "isValidated" BOOLEAN NOT NULL DEFAULT true,
    "minimumStay" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyPricing" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "displayOnWebsite" BOOLEAN NOT NULL DEFAULT true,
    "retroCommission" BOOLEAN NOT NULL DEFAULT false,
    "lastPricingUpdate" TIMESTAMP(3),
    "securityDeposit" DOUBLE PRECISION,
    "paymentSchedule" TEXT,
    "minOwnerAcceptedPrice" DOUBLE PRECISION,
    "minLCAcceptedPrice" DOUBLE PRECISION,
    "publicMinimumPrice" DOUBLE PRECISION,
    "netOwnerCommission" DOUBLE PRECISION DEFAULT 25.0,
    "publicPriceCommission" DOUBLE PRECISION DEFAULT 20.0,
    "b2b2cPartnerCommission" DOUBLE PRECISION DEFAULT 10.0,
    "publicTaxes" DOUBLE PRECISION DEFAULT 0.0,
    "clientFees" DOUBLE PRECISION DEFAULT 2.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MinimumStayRule" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingCondition" "public"."BookingCondition" NOT NULL DEFAULT 'PER_NIGHT',
    "minimumNights" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinimumStayRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperationalCost" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "costType" "public"."OperationalCostType" NOT NULL,
    "priceType" "public"."PriceType" NOT NULL DEFAULT 'PER_STAY',
    "estimatedPrice" DOUBLE PRECISION,
    "publicPrice" DOUBLE PRECISION,
    "paidBy" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resource" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Photo" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "roomId" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketingContent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amenities" TEXT[],
    "highlights" TEXT[],
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SensitiveDataAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitiveDataAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "category" "public"."GlobalContactCategory" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactProperty" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "relationship" "public"."ContactPropertyRelationship" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "openingHours" TEXT,
    "priceRange" TEXT,
    "amenities" TEXT[],
    "tags" TEXT[],
    "rating" DOUBLE PRECISION,
    "imageUrls" TEXT[],
    "comments" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EquipmentRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "status" "public"."EquipmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."EquipmentRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "items" JSONB NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegalDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."LegalDocumentCategory" NOT NULL,
    "subcategory" TEXT,
    "status" "public"."LegalDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "propertyId" TEXT,
    "expiryDate" TIMESTAMP(3),
    "reminderDays" INTEGER,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegalDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ActivityProviderToProperty" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActivityProviderToProperty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Destination_name_idx" ON "public"."Destination"("name");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "public"."Property"("status");

-- CreateIndex
CREATE INDEX "Property_destinationId_idx" ON "public"."Property"("destinationId");

-- CreateIndex
CREATE INDEX "Property_name_idx" ON "public"."Property"("name");

-- CreateIndex
CREATE INDEX "Room_propertyId_idx" ON "public"."Room"("propertyId");

-- CreateIndex
CREATE INDEX "Room_position_idx" ON "public"."Room"("position");

-- CreateIndex
CREATE INDEX "PropertyContact_propertyId_idx" ON "public"."PropertyContact"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyContact_type_idx" ON "public"."PropertyContact"("type");

-- CreateIndex
CREATE INDEX "Booking_propertyId_idx" ON "public"."Booking"("propertyId");

-- CreateIndex
CREATE INDEX "Booking_startDate_endDate_idx" ON "public"."Booking"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_type_idx" ON "public"."Booking"("type");

-- CreateIndex
CREATE INDEX "PriceRange_propertyId_idx" ON "public"."PriceRange"("propertyId");

-- CreateIndex
CREATE INDEX "PriceRange_startDate_endDate_idx" ON "public"."PriceRange"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyPricing_propertyId_key" ON "public"."PropertyPricing"("propertyId");

-- CreateIndex
CREATE INDEX "MinimumStayRule_propertyId_idx" ON "public"."MinimumStayRule"("propertyId");

-- CreateIndex
CREATE INDEX "MinimumStayRule_startDate_endDate_idx" ON "public"."MinimumStayRule"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "OperationalCost_propertyId_idx" ON "public"."OperationalCost"("propertyId");

-- CreateIndex
CREATE INDEX "Resource_propertyId_idx" ON "public"."Resource"("propertyId");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "public"."Resource"("type");

-- CreateIndex
CREATE INDEX "Photo_propertyId_idx" ON "public"."Photo"("propertyId");

-- CreateIndex
CREATE INDEX "Photo_position_idx" ON "public"."Photo"("position");

-- CreateIndex
CREATE INDEX "MarketingContent_propertyId_idx" ON "public"."MarketingContent"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingContent_propertyId_language_key" ON "public"."MarketingContent"("propertyId", "language");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SensitiveDataAccess_userId_idx" ON "public"."SensitiveDataAccess"("userId");

-- CreateIndex
CREATE INDEX "SensitiveDataAccess_propertyId_idx" ON "public"."SensitiveDataAccess"("propertyId");

-- CreateIndex
CREATE INDEX "SensitiveDataAccess_dataType_idx" ON "public"."SensitiveDataAccess"("dataType");

-- CreateIndex
CREATE INDEX "SensitiveDataAccess_createdAt_idx" ON "public"."SensitiveDataAccess"("createdAt");

-- CreateIndex
CREATE INDEX "Contact_firstName_lastName_idx" ON "public"."Contact"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "public"."Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_category_idx" ON "public"."Contact"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "public"."Contact"("email");

-- CreateIndex
CREATE INDEX "ContactProperty_contactId_idx" ON "public"."ContactProperty"("contactId");

-- CreateIndex
CREATE INDEX "ContactProperty_propertyId_idx" ON "public"."ContactProperty"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactProperty_contactId_propertyId_key" ON "public"."ContactProperty"("contactId", "propertyId");

-- CreateIndex
CREATE INDEX "ActivityProvider_name_idx" ON "public"."ActivityProvider"("name");

-- CreateIndex
CREATE INDEX "ActivityProvider_type_idx" ON "public"."ActivityProvider"("type");

-- CreateIndex
CREATE INDEX "ActivityProvider_city_idx" ON "public"."ActivityProvider"("city");

-- CreateIndex
CREATE INDEX "EquipmentRequest_propertyId_idx" ON "public"."EquipmentRequest"("propertyId");

-- CreateIndex
CREATE INDEX "EquipmentRequest_roomId_idx" ON "public"."EquipmentRequest"("roomId");

-- CreateIndex
CREATE INDEX "EquipmentRequest_status_idx" ON "public"."EquipmentRequest"("status");

-- CreateIndex
CREATE INDEX "EquipmentRequest_priority_idx" ON "public"."EquipmentRequest"("priority");

-- CreateIndex
CREATE INDEX "EquipmentRequest_createdAt_idx" ON "public"."EquipmentRequest"("createdAt");

-- CreateIndex
CREATE INDEX "LegalDocument_category_idx" ON "public"."LegalDocument"("category");

-- CreateIndex
CREATE INDEX "LegalDocument_propertyId_idx" ON "public"."LegalDocument"("propertyId");

-- CreateIndex
CREATE INDEX "LegalDocument_status_idx" ON "public"."LegalDocument"("status");

-- CreateIndex
CREATE INDEX "LegalDocument_expiryDate_idx" ON "public"."LegalDocument"("expiryDate");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_documentId_idx" ON "public"."LegalDocumentVersion"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentVersion_documentId_versionNumber_key" ON "public"."LegalDocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "_ActivityProviderToProperty_B_index" ON "public"."_ActivityProviderToProperty"("B");

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "public"."Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyContact" ADD CONSTRAINT "PropertyContact_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceRange" ADD CONSTRAINT "PriceRange_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyPricing" ADD CONSTRAINT "PropertyPricing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MinimumStayRule" ADD CONSTRAINT "MinimumStayRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalCost" ADD CONSTRAINT "OperationalCost_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketingContent" ADD CONSTRAINT "MarketingContent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContactProperty" ADD CONSTRAINT "ContactProperty_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContactProperty" ADD CONSTRAINT "ContactProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentRequest" ADD CONSTRAINT "EquipmentRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentRequest" ADD CONSTRAINT "EquipmentRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocument" ADD CONSTRAINT "LegalDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."LegalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ActivityProviderToProperty" ADD CONSTRAINT "_ActivityProviderToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ActivityProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ActivityProviderToProperty" ADD CONSTRAINT "_ActivityProviderToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

