/*
  Warnings:

  - You are about to drop the column `cancelledAt` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedHours` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `proId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `categories` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `isSuspended` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `serviceArea` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `proId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - Added the required column `addressText` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientUserId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hoursEstimate` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `pro_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProStatus" AS ENUM ('pending', 'active', 'suspended');

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_clientId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_proId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_clientId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_proId_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "cancelledAt",
DROP COLUMN "category",
DROP COLUMN "clientId",
DROP COLUMN "completedAt",
DROP COLUMN "description",
DROP COLUMN "estimatedHours",
DROP COLUMN "hourlyRate",
DROP COLUMN "proId",
DROP COLUMN "totalAmount",
ADD COLUMN     "addressText" TEXT NOT NULL,
ADD COLUMN     "clientUserId" TEXT NOT NULL,
ADD COLUMN     "hoursEstimate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "proProfileId" TEXT;

-- AlterTable
ALTER TABLE "pro_profiles" DROP COLUMN "categories",
DROP COLUMN "isApproved",
DROP COLUMN "isSuspended",
DROP COLUMN "phone",
DROP COLUMN "rating",
DROP COLUMN "reviewCount",
DROP COLUMN "serviceArea",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "status" "ProStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "clientId",
DROP COLUMN "proId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "updatedAt";

-- DropEnum
DROP TYPE "Category";

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "proProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availabilities_proProfileId_idx" ON "availabilities"("proProfileId");

-- CreateIndex
CREATE INDEX "bookings_clientUserId_idx" ON "bookings"("clientUserId");

-- CreateIndex
CREATE INDEX "bookings_proProfileId_idx" ON "bookings"("proProfileId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_scheduledAt_idx" ON "bookings"("scheduledAt");

-- CreateIndex
CREATE INDEX "pro_profiles_userId_idx" ON "pro_profiles"("userId");

-- CreateIndex
CREATE INDEX "pro_profiles_status_idx" ON "pro_profiles"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_proProfileId_fkey" FOREIGN KEY ("proProfileId") REFERENCES "pro_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_proProfileId_fkey" FOREIGN KEY ("proProfileId") REFERENCES "pro_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
