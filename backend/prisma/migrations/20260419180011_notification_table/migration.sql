-- CreateEnum
CREATE TYPE "NotificationHousingType" AS ENUM ('RESERVATION_REQUESTED', 'RESERVATION_ACCEPTED', 'RESERVATION_REJECTED', 'RESERVATION_CANCELLED', 'RESERVATION_COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationActivityType" AS ENUM ('RESERVATION_REQUESTED', 'RESERVATION_ACCEPTED', 'RESERVATION_REJECTED', 'RESERVATION_CANCELLED', 'RESERVATION_COMPLETED');

-- CreateTable
CREATE TABLE "NotificationHousing" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "housingId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" "NotificationHousingType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationHousing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationActivity" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" "NotificationActivityType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationHousing_userId_idx" ON "NotificationHousing"("userId");

-- CreateIndex
CREATE INDEX "NotificationHousing_housingId_idx" ON "NotificationHousing"("housingId");

-- CreateIndex
CREATE INDEX "NotificationHousing_isRead_idx" ON "NotificationHousing"("isRead");

-- CreateIndex
CREATE INDEX "NotificationActivity_userId_idx" ON "NotificationActivity"("userId");

-- CreateIndex
CREATE INDEX "NotificationActivity_activityId_idx" ON "NotificationActivity"("activityId");

-- CreateIndex
CREATE INDEX "NotificationActivity_isRead_idx" ON "NotificationActivity"("isRead");

-- AddForeignKey
ALTER TABLE "NotificationHousing" ADD CONSTRAINT "NotificationHousing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationHousing" ADD CONSTRAINT "NotificationHousing_housingId_fkey" FOREIGN KEY ("housingId") REFERENCES "Housing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationHousing" ADD CONSTRAINT "NotificationHousing_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationActivity" ADD CONSTRAINT "NotificationActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationActivity" ADD CONSTRAINT "NotificationActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationActivity" ADD CONSTRAINT "NotificationActivity_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ActivityReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
