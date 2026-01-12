-- CreateEnum
CREATE TYPE "PushProvider" AS ENUM ('EXPO');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID');

-- CreateTable
CREATE TABLE "device_push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PushProvider" NOT NULL DEFAULT 'EXPO',
    "platform" "DevicePlatform" NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_push_tokens_token_key" ON "device_push_tokens"("token");

-- CreateIndex
CREATE INDEX "device_push_tokens_userId_idx" ON "device_push_tokens"("userId");

-- CreateIndex
CREATE INDEX "device_push_tokens_isActive_idx" ON "device_push_tokens"("isActive");
