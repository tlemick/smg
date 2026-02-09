/**
 * Performance Computation Service
 * 
 * Pre-computes and caches portfolio performance data to avoid expensive
 * real-time calculations. This should be run as a background job.
 */

import { prisma } from '../../prisma/client';
import { getAssetHistoricalData, syncAssetHistoricalData } from './yahoo-finance-service';

interface DailyValuePoint {
  date: string;
  total: number;
}

interface Transaction {
  date: Date;
  type: string;
  quantity: number;
  total: number;
  assetId: number;
  asset: { id: number; type: string };
}

function toIsoDay(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

function buildTradingDayDomain(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  const endUtc = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
  while (cur <= endUtc) {
    days.push(cur.toISOString());
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/**
 * Compute daily portfolio values over a date range
 * This is the expensive operation we want to cache
 */
async function computePortfolioDailyValues(
  portfolioId: string,
  start: Date,
  end: Date,
  cachedHistoricalData?: Map<number, Array<{ date: Date; price: number }>>
): Promise<DailyValuePoint[]> {
  // Fetch transactions up to end date
  const transactions = await prisma.transaction.findMany({
    where: { portfolioId, date: { lte: end } },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      type: true,
      quantity: true,
      total: true,
      assetId: true,
      asset: { select: { id: true, type: true } },
    },
  });

  const assetIds = Array.from(new Set(transactions.map((t) => t.assetId)));

  // Group transactions per asset for fallback price lookup
  const txsByAsset: Record<number, { date: Date; price: number }[]> = {};
  for (const tx of transactions) {
    const arr = txsByAsset[tx.assetId] || (txsByAsset[tx.assetId] = []);
    const unitPrice = Number(tx.total) / Math.max(1, Number(tx.quantity));
    arr.push({ date: new Date(tx.date), price: unitPrice });
  }
  for (const assetId of Object.keys(txsByAsset)) {
    txsByAsset[Number(assetId)].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Use cached historical data if provided, otherwise fetch
  let historicalByAsset: Record<number, Array<{ date: Date; price: number }>>;
  
  if (cachedHistoricalData) {
    historicalByAsset = {};
    for (const assetId of assetIds) {
      historicalByAsset[assetId] = cachedHistoricalData.get(assetId) || [];
    }
  } else {
    // Fetch historical data for all assets
    historicalByAsset = {};
    for (const assetId of assetIds) {
      try {
        await syncAssetHistoricalData(assetId, start, end);
      } catch (error) {
        console.error(`Failed to sync historical data for asset ${assetId}:`, error);
      }
      const hist = await getAssetHistoricalData(assetId, start, end);
      const arr = hist
        .map((h) => ({
          date: new Date(h.date as any),
          price: (h.close as number) ?? (h.adjustedClose as number) ?? 0,
        }))
        .filter((h) => !!h.price)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      historicalByAsset[assetId] = arr;
    }
  }

  // Get portfolio starting cash
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: { gameSession: true },
  });
  let startingCash = portfolio?.gameSession?.startingCash
    ? Number(portfolio.gameSession.startingCash)
    : Number(portfolio?.cash_balance || 0);

  // Track cash flows by day
  const txsByDay: Record<string, { buy: number; sell: number }> = {};
  for (const tx of transactions) {
    const k = new Date(tx.date).toISOString().slice(0, 10);
    if (!txsByDay[k]) txsByDay[k] = { buy: 0, sell: 0 };
    if (tx.type.toUpperCase() === 'BUY') txsByDay[k].buy += Number(tx.total);
    else txsByDay[k].sell += Number(tx.total);
  }

  const domain = buildTradingDayDomain(start, end);
  const runningQty: Record<number, number> = {};
  let txIndex = 0;
  let cashCursor = startingCash;

  const points: DailyValuePoint[] = [];
  for (const dayIso of domain) {
    const day = new Date(dayIso);
    const dayEnd = new Date(day);
    dayEnd.setUTCHours(23, 59, 59, 999);

    // Apply transactions up to day end
    while (txIndex < transactions.length && new Date(transactions[txIndex].date) <= dayEnd) {
      const tx = transactions[txIndex];
      const sign = tx.type.toUpperCase() === 'BUY' ? 1 : -1;
      runningQty[tx.assetId] = (runningQty[tx.assetId] || 0) + sign * tx.quantity;
      txIndex++;
    }

    const keyDay = day.toISOString().slice(0, 10);
    const flows = txsByDay[keyDay];
    if (flows) {
      cashCursor = cashCursor - (flows.buy || 0) + (flows.sell || 0);
    }

    let holdingsValue = 0;
    for (const assetId of assetIds) {
      const qty = runningQty[assetId] || 0;
      if (qty === 0) continue;
      const arr = historicalByAsset[assetId] || [];
      if (arr.length === 0) continue;

      // Find price: prefer historical <= dayEnd
      let price = 0;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].date.getTime() <= dayEnd.getTime()) {
          price = arr[i].price;
          break;
        }
      }
      if (!price) {
        const txArr = txsByAsset[assetId] || [];
        for (let i = txArr.length - 1; i >= 0; i--) {
          if (txArr[i].date.getTime() <= dayEnd.getTime()) {
            price = txArr[i].price;
            break;
          }
        }
      }
      if (!price && arr.length > 0) {
        price = arr[0].price; // carry-backwards earliest known price
      }
      if (!price) continue;
      holdingsValue += qty * price;
    }

    const total = holdingsValue + cashCursor;
    points.push({ date: dayIso, total: Number(total.toFixed(2)) });
  }

  return points;
}

/**
 * Fetch and cache S&P 500 historical data
 */
async function getSp500Series(
  start: Date,
  end: Date
): Promise<Array<{ date: string; close: number }>> {
  const sp500 = await prisma.asset.findUnique({ where: { ticker: '^GSPC' } });
  if (!sp500) return [];

  await syncAssetHistoricalData(sp500.id, start, end).catch(() => {});
  const hist = await getAssetHistoricalData(sp500.id, start, end);

  return hist
    .map((h) => ({
      date: new Date(h.date as any).toISOString(),
      close: (h.close as number) ?? (h.adjustedClose as number) ?? 0,
    }))
    .filter((h) => !!h.close)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Compute performance for a single portfolio and store in database
 */
export async function computeAndStorePortfolioPerformance(
  portfolioId: string,
  sessionStartDate: Date,
  sessionEndDate: Date,
  startingCash: number
): Promise<void> {
  const start = new Date(sessionStartDate);
  const today = new Date();
  const end = new Date(Math.min(today.getTime(), new Date(sessionEndDate).getTime()));

  console.log(`Computing performance for portfolio ${portfolioId} from ${start.toISOString()} to ${end.toISOString()}`);

  // Compute portfolio daily values
  const portfolioValues = await computePortfolioDailyValues(portfolioId, start, end);

  // Get S&P 500 data
  const sp500Values = await getSp500Series(start, end);

  // Find base values (first non-zero)
  const portfolioBase = portfolioValues.find((v) => v.total > 0)?.total || startingCash;
  const sp500Base = sp500Values.find((v) => v.close > 0)?.close || null;

  // Create lookup maps
  const portfolioMap = new Map(portfolioValues.map((v) => [v.date.slice(0, 10), v.total]));
  const sp500Map = new Map(sp500Values.map((v) => [v.date.slice(0, 10), v.close]));

  // Prepare bulk insert data
  const performanceRecords = [];
  let lastPortfolioValue = portfolioBase;
  let lastSp500Value = sp500Base;

  for (const pv of portfolioValues) {
    const dateKey = pv.date.slice(0, 10);
    const portfolioValue = portfolioMap.get(dateKey) ?? lastPortfolioValue;
    const sp500Value = sp500Map.get(dateKey) ?? lastSp500Value;

    if (portfolioValue) lastPortfolioValue = portfolioValue;
    if (sp500Value) lastSp500Value = sp500Value;

    const portfolioPercentChange = ((portfolioValue - portfolioBase) / portfolioBase) * 100;
    const sp500PercentChange =
      sp500Base && lastSp500Value ? ((lastSp500Value - sp500Base) / sp500Base) * 100 : 0;
    const outperformance = portfolioPercentChange - sp500PercentChange;

    performanceRecords.push({
      portfolioId,
      date: new Date(pv.date),
      portfolio_value: Number(portfolioValue.toFixed(2)),
      sp500_value: Number((lastSp500Value || 0).toFixed(2)),
      portfolio_percent_change: Number(portfolioPercentChange.toFixed(4)),
      sp500_percent_change: Number(sp500PercentChange.toFixed(4)),
      outperformance: Number(outperformance.toFixed(4)),
    });
  }

  // Bulk upsert (delete old + insert new for this date range)
  await prisma.portfolioPerformance.deleteMany({
    where: {
      portfolioId,
      date: { gte: start, lte: end },
    },
  });

  if (performanceRecords.length > 0) {
    await prisma.portfolioPerformance.createMany({
      data: performanceRecords,
    });
  }

  console.log(`Stored ${performanceRecords.length} performance records for portfolio ${portfolioId}`);
}

/**
 * Compute performance for all portfolios in a session
 * This is the main entry point for background jobs
 */
export async function computeSessionPerformance(sessionId: string): Promise<void> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { portfolios: true },
  });

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  console.log(`Computing performance for ${session.portfolios.length} portfolios in session ${sessionId}`);

  // Pre-fetch all asset historical data for the session (optimization)
  const allAssetIds = new Set<number>();
  for (const portfolio of session.portfolios) {
    const transactions = await prisma.transaction.findMany({
      where: { portfolioId: portfolio.id },
      select: { assetId: true },
      distinct: ['assetId'],
    });
    transactions.forEach((t) => allAssetIds.add(t.assetId));
  }

  console.log(`Pre-fetching historical data for ${allAssetIds.size} assets...`);
  const start = new Date(session.startDate);
  const today = new Date();
  const end = new Date(Math.min(today.getTime(), new Date(session.endDate).getTime()));

  // Parallel fetch of historical data
  await Promise.all(
    Array.from(allAssetIds).map(async (assetId) => {
      try {
        await syncAssetHistoricalData(assetId, start, end);
      } catch (error) {
        console.error(`Failed to sync asset ${assetId}:`, error);
      }
    })
  );

  console.log('Historical data fetch complete. Computing portfolio performance...');

  // Compute performance for each portfolio
  for (const portfolio of session.portfolios) {
    try {
      await computeAndStorePortfolioPerformance(
        portfolio.id,
        session.startDate,
        session.endDate,
        session.startingCash
      );
    } catch (error) {
      console.error(`Failed to compute performance for portfolio ${portfolio.id}:`, error);
    }
  }

  console.log(`Session ${sessionId} performance computation complete`);
}

/**
 * Compute and store user rankings for a session
 * This pre-computes the leaderboard data for fast loading
 */
export async function computeAndStoreSessionRankings(sessionId: string): Promise<void> {
  console.log(`Computing rankings for session ${sessionId}`);

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Get all portfolios in the session with holdings and users
  const portfoliosInSession = await prisma.portfolio.findMany({
    where: { sessionId },
    include: {
      user: true,
      holdings: { select: { assetId: true, quantity: true } },
    },
  });

  if (portfoliosInSession.length === 0) {
    console.log(`No portfolios found for session ${sessionId}`);
    return;
  }

  // Collect unique assetIds to fetch quotes in bulk from cache
  const uniqueAssetIds = Array.from(
    new Set(portfoliosInSession.flatMap((p) => p.holdings.map((h) => h.assetId)))
  );
  const cachedQuotes =
    uniqueAssetIds.length > 0
      ? await prisma.assetQuoteCache.findMany({ where: { assetId: { in: uniqueAssetIds } } })
      : [];
  const priceMap = new Map<number, number>();
  for (const q of cachedQuotes) {
    priceMap.set(q.assetId, Number(q.regularMarketPrice));
  }

  // Aggregate per-user totals across their portfolios in this session
  const byUser = new Map<
    string,
    { userId: string; name: string; email: string; totalPortfolioValue: number; portfolioCount: number }
  >();

  for (const pf of portfoliosInSession) {
    let total = Number(pf.cash_balance) || 0;
    for (const h of pf.holdings) {
      const price = priceMap.get(h.assetId) || 0;
      total += Number(h.quantity) * price;
    }
    const key = pf.user.id;
    const existing = byUser.get(key);
    if (existing) {
      existing.totalPortfolioValue += total;
      existing.portfolioCount += 1;
    } else {
      byUser.set(key, {
        userId: pf.user.id,
        name: pf.user.name || pf.user.email.split('@')[0],
        email: pf.user.email,
        totalPortfolioValue: total,
        portfolioCount: 1,
      });
    }
  }

  const perUser = Array.from(byUser.values());

  // Compute return percent against session starting cash
  const sessionStartingCash = Number(session.startingCash);
  const userRankings = perUser.map((u) => {
    const base = sessionStartingCash * Math.max(1, u.portfolioCount);
    const returnPercent = base > 0 ? ((u.totalPortfolioValue / base - 1) * 100) : 0;
    return { ...u, returnPercent };
  });

  // Sort by return percent desc
  userRankings.sort((a, b) => b.returnPercent - a.returnPercent || a.name.localeCompare(b.name));

  // Delete existing rankings for this session
  await prisma.userRanking.deleteMany({
    where: { sessionId },
  });

  // Create new rankings
  const rankingRecords = userRankings.map((u, index) => ({
    userId: u.userId,
    sessionId,
    rank: index + 1,
    totalPortfolioValue: Number(u.totalPortfolioValue.toFixed(2)),
    returnPercent: Number(u.returnPercent.toFixed(2)),
  }));

  if (rankingRecords.length > 0) {
    await prisma.userRanking.createMany({
      data: rankingRecords,
    });
  }

  console.log(`Stored ${rankingRecords.length} rankings for session ${sessionId}`);
}

/**
 * Compute performance for all active sessions
 * Run this as a cron job (e.g., nightly at 6 PM after market close)
 */
export async function computeAllActiveSessionsPerformance(): Promise<void> {
  const activeSessions = await prisma.gameSession.findMany({
    where: { isActive: true },
  });

  console.log(`Computing performance for ${activeSessions.length} active sessions`);

  for (const session of activeSessions) {
    try {
      await computeSessionPerformance(session.id);
      // Also compute rankings after performance data
      await computeAndStoreSessionRankings(session.id);
    } catch (error) {
      console.error(`Failed to compute performance for session ${session.id}:`, error);
    }
  }

  console.log('All active sessions performance computation complete');
}
