-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "housingId" TEXT NOT NULL,
    "touristId" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_housingId_idx" ON "Reservation"("housingId");

-- CreateIndex
CREATE INDEX "Reservation_touristId_idx" ON "Reservation"("touristId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_housingId_fkey" FOREIGN KEY ("housingId") REFERENCES "Housing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_touristId_fkey" FOREIGN KEY ("touristId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
