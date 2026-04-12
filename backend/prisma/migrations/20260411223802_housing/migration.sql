-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('ART_HERITAGE', 'GASTRONOMY', 'COASTAL_ESCAPE', 'HISTORICAL_TOUR', 'ARTISAN_WORKSHOP', 'DESERT_EXPEDITION', 'NATURE_ADVENTURE', 'CULTURAL_EVENT', 'WELLNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "status" "ActivityStatus" NOT NULL DEFAULT 'APPROVED',
    "capacity" INTEGER NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_category_idx" ON "Activity"("category");

-- CreateIndex
CREATE INDEX "Activity_creatorId_idx" ON "Activity"("creatorId");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "Activity"("date");

-- CreateIndex
CREATE INDEX "Activity_location_idx" ON "Activity"("location");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
