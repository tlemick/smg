#!/usr/bin/env tsx
/**
 * Verification script: Portfolio Highlights math (Your Gain vs Price Change)
 *
 * Traces the actual data flow and recomputes both metrics to verify correctness.
 * Run: tsx scripts/verify-portfolio-highlights-math.ts
 *
 * Requires: DATABASE_URL in .env.local, seeded demo data
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '../prisma/client';
import { getAssetHistoricalData } from '../src/lib/yahoo-finance-service';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Portfolio Highlights Math Verification');
  console.log('  (Your Gain vs Price Change since first buy)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Find a demo user with UNH holding (or first stock we find)
  const holdingWithUser = await prisma.holding.findFirst({
    where: {
      asset: { ticker: 'UNH', type: 'STOCK' },
    },
    include: {
      asset: true,
      portfolio: { include: { user: true, gameSession: true } },
    },
  });

  if (!holdingWithUser) {
    console.log('❌ No UNH holding found. Run seed-demo-investors first.');
    process.exit(1);
  }

  const holding = holdingWithUser;
  const asset = holdingWithUser.asset;
  const portfolio = holdingWithUser.portfolio;
  const user = portfolio.user;
  const session = portfolio.gameSession;

  console.log('📋 Sample Data (UNH):');
  console.log('   User:', user.email);
  console.log('   Portfolio:', portfolio.name);
  console.log('   Session:', session?.name, `(${session?.startDate?.toISOString().slice(0, 10)} - ${session?.endDate?.toISOString().slice(0, 10)})`);
  console.log('   Quantity:', holding.quantity);
  console.log('   Average Price (cost basis):', holding.averagePrice.toFixed(4));
  console.log('   Total Cost Basis:', (holding.quantity * holding.averagePrice).toFixed(2));
  console.log('');

  // 2. Get first BUY transaction for UNH (what first-purchase-dates would return)
  const firstTx = await prisma.transaction.findFirst({
    where: {
      portfolioId: portfolio.id,
      assetId: asset.id,
      type: 'BUY',
    },
    orderBy: { date: 'asc' },
    select: { date: true, price: true, quantity: true, total: true },
  });

  if (!firstTx) {
    console.log('❌ No BUY transaction found for UNH.');
    process.exit(1);
  }

  console.log('📅 First Purchase (Transaction):');
  console.log('   Date:', firstTx.date.toISOString());
  console.log('   Price:', firstTx.price.toFixed(4));
  console.log('   Quantity:', firstTx.quantity);
  console.log('   Total:', firstTx.total.toFixed(2));
  console.log('');

  // 3. Get current price from quote cache (what overview uses)
  const quoteCache = await prisma.assetQuoteCache.findUnique({
    where: { assetId: asset.id },
  });

  const currentPrice = quoteCache?.regularMarketPrice ?? 0;
  if (!currentPrice) {
    console.log('⚠️  No quote cache for UNH. Run app or refresh quotes first.');
  }

  console.log('💰 Current Price (Quote Cache):');
  console.log('   Price:', currentPrice.toFixed(4));
  console.log('');

  // 4. Compute "Your Gain" (same as portfolio overview)
  const totalCostBasis = holding.quantity * holding.averagePrice;
  const currentValue = holding.quantity * currentPrice;
  const unrealizedPnL = currentValue - totalCostBasis;
  const unrealizedPnLPercent =
    totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  YOUR GAIN (from portfolio overview logic)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Formula: (currentValue - totalCostBasis) / totalCostBasis * 100');
  console.log('   currentValue = quantity × currentPrice =', currentValue.toFixed(2));
  console.log('   totalCostBasis = quantity × averagePrice =', totalCostBasis.toFixed(2));
  console.log('   unrealizedPnL =', unrealizedPnL.toFixed(2));
  console.log('   unrealizedPnLPercent =', unrealizedPnLPercent.toFixed(2) + '%');
  console.log('');

  // 5. Chart period: first-purchase-dates uses auth_token (JWT) but login sets user_session
  //    → first-purchase-dates returns 401 → hook falls back to 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PRICE CHANGE (from chart/batch logic)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   ⚠️  AUTH BUG: first-purchase-dates uses auth_token (JWT)');
  console.log('      but login only sets user_session → always 401');
  console.log('      → Hook falls back to 30-day period (not "since first buy")');
  console.log('   Chart period used: 30 days ago → now');
  console.log('   period1:', thirtyDaysAgo.toISOString().slice(0, 10));
  console.log('   period2:', now.toISOString().slice(0, 10));
  console.log('');

  // 6. Fetch historical data (same as chart batch)
  const histData = await getAssetHistoricalData(asset.id, thirtyDaysAgo, now);
  const closePrices = histData
    .map((h: any) => ({
      date: new Date(h.date),
      close: (h.close ?? h.adjustedClose) ?? 0,
    }))
    .filter((h: any) => h.close > 0)
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
    .map((h: any) => h.close);

  let priceChangePercent: number | null = null;
  let firstPrice: number | null = null;
  let lastPrice: number | null = null;

  if (closePrices.length >= 2) {
    firstPrice = closePrices[0];
    lastPrice = closePrices[closePrices.length - 1];
    priceChangePercent = ((lastPrice! - firstPrice!) / firstPrice!) * 100;
  }

  console.log('   Historical close prices (30d):', closePrices.length, 'points');
  if (firstPrice != null && lastPrice != null) {
    console.log('   firstPrice (30d ago):', firstPrice.toFixed(4));
    console.log('   lastPrice (today):', lastPrice.toFixed(4));
    console.log('   priceChangePercent = (last - first) / first * 100 =', priceChangePercent!.toFixed(2) + '%');
  } else {
    console.log('   ⚠️  Insufficient historical data');
  }
  console.log('');

  // 7. Also compute "Price Change since first buy" (what it SHOULD be if auth worked)
  const firstBuyDate = firstTx.date;
  const histSinceFirstBuy = await getAssetHistoricalData(
    asset.id,
    new Date(firstBuyDate.getTime() - 24 * 60 * 60 * 1000), // day before to catch first day
    now
  );
  const closesSinceFirst = histSinceFirstBuy
    .map((h: any) => ({
      date: new Date(h.date),
      close: (h.close ?? h.adjustedClose) ?? 0,
    }))
    .filter((h: any) => h.close > 0 && new Date(h.date) >= firstBuyDate)
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
    .map((h: any) => h.close);

  let priceChangeSinceFirstBuy: number | null = null;
  let firstCloseOnOrAfterBuy: number | null = null;
  if (closesSinceFirst.length >= 2) {
    firstCloseOnOrAfterBuy = closesSinceFirst[0];
    const lastClose = closesSinceFirst[closesSinceFirst.length - 1];
    priceChangeSinceFirstBuy =
      ((lastClose - firstCloseOnOrAfterBuy) / firstCloseOnOrAfterBuy) * 100;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PRICE CHANGE "since first buy" (if auth worked)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   First buy date:', firstBuyDate.toISOString().slice(0, 10));
  if (firstCloseOnOrAfterBuy != null) {
    console.log('   First close on/after buy:', firstCloseOnOrAfterBuy.toFixed(4));
    console.log('   Last close (today):', currentPrice.toFixed(4));
    console.log('   priceChangePercent =', priceChangeSinceFirstBuy!.toFixed(2) + '%');
  } else {
    console.log('   ⚠️  No historical data from first buy date');
  }
  console.log('');

  // 8. Compare cost basis vs first close
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  CROSS-CHECK: Why Your Gain ≠ Price Change?');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Cost basis (from Holding.averagePrice):', holding.averagePrice.toFixed(4));
  console.log('   Transaction price (first buy):', firstTx.price.toFixed(4));
  if (firstCloseOnOrAfterBuy != null) {
    console.log('   First close on/after buy (chart data):', firstCloseOnOrAfterBuy.toFixed(4));
    const diffBasisVsTx = Math.abs(holding.averagePrice - firstTx.price);
    const diffBasisVsClose = Math.abs(holding.averagePrice - firstCloseOnOrAfterBuy);
    console.log('   Cost basis vs tx price diff:', diffBasisVsTx.toFixed(4));
    console.log('   Cost basis vs first close diff:', diffBasisVsClose.toFixed(4));
  }
  console.log('');
  console.log('   Expected: With single buy at game start, cost basis should match');
  console.log('   transaction price. Chart firstPrice = close on first trading day.');
  console.log('   Small differences can arise from: adjusted vs unadjusted close,');
  console.log('   or date boundary (tx at 9:30 AM vs daily close).');
  console.log('');

  // 9. Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Your Gain:      ', unrealizedPnLPercent.toFixed(2) + '%', '($' + unrealizedPnL.toFixed(2) + ')');
  console.log('   Price Change:   ', priceChangePercent != null ? priceChangePercent.toFixed(2) + '% (30d)' : 'N/A');
  console.log('   Since first buy:', priceChangeSinceFirstBuy != null ? priceChangeSinceFirstBuy.toFixed(2) + '%' : 'N/A');
  console.log('');
  console.log('   ✅ Your Gain uses: Holding.averagePrice (cost basis) vs current quote');
  console.log('   ⚠️  Price Change uses: 30-day period (auth bug) or first-purchase date');
  console.log('   ⚠️  Fix: first-purchase-dates should use user_session like other routes');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
