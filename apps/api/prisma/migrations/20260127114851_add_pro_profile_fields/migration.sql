-- AlterTable
ALTER TABLE "pro_profiles" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedJobsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isTopPro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responseTimeMinutes" INTEGER;

-- CreateIndex
CREATE INDEX "pro_profiles_profileCompleted_idx" ON "pro_profiles"("profileCompleted");

-- CreateIndex
CREATE INDEX "pro_profiles_isTopPro_idx" ON "pro_profiles"("isTopPro");

-- CreateIndex
CREATE INDEX "pro_profiles_status_profileCompleted_idx" ON "pro_profiles"("status", "profileCompleted");
