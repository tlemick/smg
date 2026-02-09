-- CreateTable
CREATE TABLE "UserRanking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalPortfolioValue" DOUBLE PRECISION NOT NULL,
    "returnPercent" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRanking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRanking_sessionId_rank_idx" ON "UserRanking"("sessionId", "rank");

-- CreateIndex
CREATE INDEX "UserRanking_calculatedAt_idx" ON "UserRanking"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRanking_userId_sessionId_key" ON "UserRanking"("userId", "sessionId");

-- AddForeignKey
ALTER TABLE "UserRanking" ADD CONSTRAINT "UserRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRanking" ADD CONSTRAINT "UserRanking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
