/*
  Warnings:

  - You are about to drop the column `cik` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `compositeFigi` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `shareClassFigi` on the `Stock` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ticker]` on the table `Stock` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bond" ALTER COLUMN "issuer" DROP NOT NULL,
ALTER COLUMN "issueDate" DROP NOT NULL,
ALTER COLUMN "maturityDate" DROP NOT NULL,
ALTER COLUMN "couponRate" DROP NOT NULL,
ALTER COLUMN "faceValue" DROP NOT NULL,
ALTER COLUMN "bondType" DROP NOT NULL,
ALTER COLUMN "paymentFrequency" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DailyAggregate" ADD COLUMN     "adjustedClose" DOUBLE PRECISION,
ADD COLUMN     "dataSource" TEXT NOT NULL DEFAULT 'yfinance',
ALTER COLUMN "volume" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "MutualFund" ALTER COLUMN "fundType" DROP NOT NULL,
ALTER COLUMN "expenseRatio" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "cik",
DROP COLUMN "compositeFigi",
DROP COLUMN "shareClassFigi";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "AssetQuoteCache" (
    "id" TEXT NOT NULL,
    "assetId" INTEGER NOT NULL,
    "regularMarketPrice" DOUBLE PRECISION NOT NULL,
    "regularMarketChange" DOUBLE PRECISION,
    "regularMarketChangePercent" DOUBLE PRECISION,
    "regularMarketPreviousClose" DOUBLE PRECISION,
    "regularMarketOpen" DOUBLE PRECISION,
    "regularMarketDayLow" DOUBLE PRECISION,
    "regularMarketDayHigh" DOUBLE PRECISION,
    "regularMarketVolume" BIGINT,
    "currency" TEXT NOT NULL,
    "exchangeName" TEXT,
    "marketState" TEXT,
    "preMarketPrice" DOUBLE PRECISION,
    "preMarketChange" DOUBLE PRECISION,
    "postMarketPrice" DOUBLE PRECISION,
    "postMarketChange" DOUBLE PRECISION,
    "fiftyTwoWeekLow" DOUBLE PRECISION,
    "fiftyTwoWeekHigh" DOUBLE PRECISION,
    "marketCap" BIGINT,
    "sharesOutstanding" BIGINT,
    "averageVolume" BIGINT,
    "averageVolume10days" BIGINT,
    "bookValue" DOUBLE PRECISION,
    "priceToBook" DOUBLE PRECISION,
    "earningsPerShare" DOUBLE PRECISION,
    "trailingPE" DOUBLE PRECISION,
    "forwardPE" DOUBLE PRECISION,
    "dividendRate" DOUBLE PRECISION,
    "dividendYield" DOUBLE PRECISION,
    "exDividendDate" TIMESTAMP(3),
    "beta" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetQuoteCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetProfile" (
    "id" TEXT NOT NULL,
    "assetId" INTEGER NOT NULL,
    "marketCap" BIGINT,
    "enterpriseValue" BIGINT,
    "trailingPE" DOUBLE PRECISION,
    "forwardPE" DOUBLE PRECISION,
    "priceToBook" DOUBLE PRECISION,
    "beta" DOUBLE PRECISION,
    "dividendYield" DOUBLE PRECISION,
    "website" TEXT,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "fullTimeEmployees" INTEGER,
    "sector" TEXT,
    "industry" TEXT,
    "totalRevenue" BIGINT,
    "totalDebt" BIGINT,
    "totalCash" BIGINT,
    "operatingCashflow" BIGINT,
    "earningsGrowth" DOUBLE PRECISION,
    "revenueGrowth" DOUBLE PRECISION,
    "grossMargins" DOUBLE PRECISION,
    "operatingMargins" DOUBLE PRECISION,
    "profitMargins" DOUBLE PRECISION,
    "returnsOnEquity" DOUBLE PRECISION,
    "returnsOnAssets" DOUBLE PRECISION,
    "debtToEquity" DOUBLE PRECISION,
    "currentRatio" DOUBLE PRECISION,
    "quickRatio" DOUBLE PRECISION,
    "recommendationKey" TEXT,
    "recommendationMean" DOUBLE PRECISION,
    "targetHighPrice" DOUBLE PRECISION,
    "targetLowPrice" DOUBLE PRECISION,
    "targetMeanPrice" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YahooSearchCache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YahooSearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetQuoteCache_assetId_key" ON "AssetQuoteCache"("assetId");

-- CreateIndex
CREATE INDEX "AssetQuoteCache_assetId_idx" ON "AssetQuoteCache"("assetId");

-- CreateIndex
CREATE INDEX "AssetQuoteCache_expiresAt_idx" ON "AssetQuoteCache"("expiresAt");

-- CreateIndex
CREATE INDEX "AssetQuoteCache_marketState_idx" ON "AssetQuoteCache"("marketState");

-- CreateIndex
CREATE UNIQUE INDEX "AssetProfile_assetId_key" ON "AssetProfile"("assetId");

-- CreateIndex
CREATE INDEX "AssetProfile_assetId_idx" ON "AssetProfile"("assetId");

-- CreateIndex
CREATE INDEX "AssetProfile_sector_idx" ON "AssetProfile"("sector");

-- CreateIndex
CREATE INDEX "AssetProfile_industry_idx" ON "AssetProfile"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "YahooSearchCache_query_key" ON "YahooSearchCache"("query");

-- CreateIndex
CREATE INDEX "YahooSearchCache_query_idx" ON "YahooSearchCache"("query");

-- CreateIndex
CREATE INDEX "YahooSearchCache_expiresAt_idx" ON "YahooSearchCache"("expiresAt");

-- CreateIndex
CREATE INDEX "DailyAggregate_dataSource_idx" ON "DailyAggregate"("dataSource");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ticker_key" ON "Stock"("ticker");

-- CreateIndex
CREATE INDEX "Stock_ticker_idx" ON "Stock"("ticker");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- AddForeignKey
ALTER TABLE "AssetQuoteCache" ADD CONSTRAINT "AssetQuoteCache_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetProfile" ADD CONSTRAINT "AssetProfile_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
