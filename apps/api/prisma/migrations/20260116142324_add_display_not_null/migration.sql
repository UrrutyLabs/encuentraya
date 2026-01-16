/*
  Warnings:

  - Made the column `displayId` on table `bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "displayId" SET NOT NULL;
