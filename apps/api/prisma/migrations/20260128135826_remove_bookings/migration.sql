/*
  Warnings:

  - The values [BOOKING_STATUS_FORCED] on the enum `AuditEventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isFirstBooking` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `bookings` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditEventType_new" AS ENUM ('PRO_SUSPENDED', 'PRO_UNSUSPENDED', 'PRO_APPROVED', 'ORDER_STATUS_FORCED', 'PAYMENT_SYNCED', 'PAYOUT_CREATED', 'PAYOUT_SENT', 'USER_ROLE_CHANGED');
ALTER TABLE "audit_logs" ALTER COLUMN "eventType" TYPE "AuditEventType_new" USING ("eventType"::text::"AuditEventType_new");
ALTER TYPE "AuditEventType" RENAME TO "AuditEventType_old";
ALTER TYPE "AuditEventType_new" RENAME TO "AuditEventType";
DROP TYPE "public"."AuditEventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_clientUserId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_proProfileId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_subcategoryId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "isFirstBooking",
ADD COLUMN     "isFirstOrder" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "bookings";

-- DropEnum
DROP TYPE "BookingStatus";
