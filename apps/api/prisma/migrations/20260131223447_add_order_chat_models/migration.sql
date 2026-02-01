-- CreateEnum
CREATE TYPE "ChatSenderRole" AS ENUM ('client', 'pro', 'admin', 'system');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('user', 'system');

-- CreateTable
CREATE TABLE "order_messages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderRole" "ChatSenderRole" NOT NULL DEFAULT 'system',
    "type" "ChatMessageType" NOT NULL DEFAULT 'user',
    "text" TEXT NOT NULL,
    "attachmentsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_thread_states" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_thread_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_messages_orderId_createdAt_idx" ON "order_messages"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_messages_senderUserId_idx" ON "order_messages"("senderUserId");

-- CreateIndex
CREATE INDEX "order_thread_states_userId_idx" ON "order_thread_states"("userId");

-- CreateIndex
CREATE INDEX "order_thread_states_orderId_idx" ON "order_thread_states"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_thread_states_orderId_userId_key" ON "order_thread_states"("orderId", "userId");

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_thread_states" ADD CONSTRAINT "order_thread_states_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_thread_states" ADD CONSTRAINT "order_thread_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
