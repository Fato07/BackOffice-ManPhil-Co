-- CreateEnum
CREATE TYPE "public"."BookingCondition" AS ENUM ('PER_NIGHT', 'WEEKLY_SATURDAY_TO_SATURDAY', 'WEEKLY_SUNDAY_TO_SUNDAY', 'WEEKLY_MONDAY_TO_MONDAY');

-- CreateEnum
CREATE TYPE "public"."OperationalCostType" AS ENUM ('HOUSEKEEPING', 'HOUSEKEEPING_AT_CHECKOUT', 'LINEN_CHANGE', 'OPERATIONAL_PACKAGE');

-- CreateEnum
CREATE TYPE "public"."PriceType" AS ENUM ('PER_STAY', 'PER_WEEK', 'PER_DAY', 'FIXED');

-- AlterTable
ALTER TABLE "public"."PriceRange" ADD COLUMN     "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
ADD COLUMN     "isValidated" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ownerNightlyRate" DOUBLE PRECISION,
ADD COLUMN     "ownerWeeklyRate" DOUBLE PRECISION,
ADD COLUMN     "publicNightlyRate" DOUBLE PRECISION,
ADD COLUMN     "publicWeeklyRate" DOUBLE PRECISION,
ALTER COLUMN "nightlyRate" DROP NOT NULL;

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

-- CreateIndex
CREATE UNIQUE INDEX "PropertyPricing_propertyId_key" ON "public"."PropertyPricing"("propertyId");

-- CreateIndex
CREATE INDEX "MinimumStayRule_propertyId_idx" ON "public"."MinimumStayRule"("propertyId");

-- CreateIndex
CREATE INDEX "MinimumStayRule_startDate_endDate_idx" ON "public"."MinimumStayRule"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "OperationalCost_propertyId_idx" ON "public"."OperationalCost"("propertyId");

-- AddForeignKey
ALTER TABLE "public"."PropertyPricing" ADD CONSTRAINT "PropertyPricing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MinimumStayRule" ADD CONSTRAINT "MinimumStayRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalCost" ADD CONSTRAINT "OperationalCost_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
