-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "relatedAssetId" INTEGER,
    "relatedOrderId" TEXT,
    "relatedTransactionId" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "actionUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "UserActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_type_idx" ON "UserActivity"("userId", "type");

-- CreateIndex
CREATE INDEX "UserActivity_userId_read_idx" ON "UserActivity"("userId", "read");

-- CreateIndex
CREATE INDEX "UserActivity_importance_idx" ON "UserActivity"("importance");

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_relatedAssetId_fkey" FOREIGN KEY ("relatedAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
