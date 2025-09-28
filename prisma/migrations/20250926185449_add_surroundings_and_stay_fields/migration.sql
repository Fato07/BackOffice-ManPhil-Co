-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ContactType" ADD VALUE 'HOUSEKEEPING';
ALTER TYPE "public"."ContactType" ADD VALUE 'GARDENING';
ALTER TYPE "public"."ContactType" ADD VALUE 'POOL_MAINTENANCE';
ALTER TYPE "public"."ContactType" ADD VALUE 'CHECK_IN_STAFF';

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "checkInPerson" TEXT,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "electricMeterAccessible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "electricMeterLocation" TEXT,
ADD COLUMN     "hasFireAlarm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasFireExtinguisher" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobileNetworkCoverage" TEXT,
ADD COLUMN     "stayMetadata" JSONB,
ADD COLUMN     "surroundings" JSONB,
ADD COLUMN     "wifiInAllRooms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wifiName" TEXT,
ADD COLUMN     "wifiPassword" TEXT,
ADD COLUMN     "wifiSpeed" TEXT;

-- AlterTable
ALTER TABLE "public"."PropertyContact" ADD COLUMN     "metadata" JSONB;
