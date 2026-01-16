/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "displayId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_displayId_key" ON "bookings"("displayId");
