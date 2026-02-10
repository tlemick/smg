import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';
import { getAssetHistoricalData, syncAssetHistoricalData, createAssetFromTicker } from '@/lib/yahoo-finance-service';

type DailyValuePoint = { date: string; total: number };

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    if (!sessionCookie) return null;
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
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

async function computePortfolioDailyValues(portfolioId: string, start: Date, end: Date): Promise<DailyValuePoint[]> {
  // Fetch transactions up to end date
  const transactions = await prisma.transaction.findMany({
    where: { portfolioId, date: { lte: end } },
    orderBy: { date: 'asc' },
    select: { date: true, type: true, quantity: true, total: true, assetId: true, asset: { select: { id: true, type: true } } },
  });

  const assetIds = Array.from(new Set(transactions.map(t => t.assetId)));

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

  // Prefetch historical closes
  const historicalByAsset: Record<number, Array<{ date: Date; price: number }>> = {};
  for (const assetId of assetIds) {
    try {
      await syncAssetHistoricalData(assetId, start, end);
    } catch (error) {
      console.error(`Failed to sync historical data for asset ${assetId}:`, error);
      // Continue with cached data if sync fails
    }
    const hist = await getAssetHistoricalData(assetId, start, end);
    const arr = hist
      .map(h => ({ date: new Date(h.date as any), price: (h.close as number) ?? (h.adjustedClose as number) ?? 0 }))
      .filter(h => !!h.price)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    historicalByAsset[assetId] = arr;
  }

  // Daily cash from flows; start from portfolio's session starting cash when available
  const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId }, include: { gameSession: true } });
  let startingCash = portfolio?.gameSession?.startingCash ? Number(portfolio.gameSession.startingCash) : Number(portfolio?.cash_balance || 0);
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
      // find price: prefer historical <= dayEnd; else last tx price <= dayEnd; else earliest historical (carry-backwards)
      let price = 0;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].date.getTime() <= dayEnd.getTime()) { price = arr[i].price; break; }
      }
      if (!price) {
        const txArr = txsByAsset[assetId] || [];
        for (let i = txArr.length - 1; i >= 0; i--) {
          if (txArr[i].date.getTime() <= dayEnd.getTime()) { price = txArr[i].price; break; }
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

async function getSp500Series(start: Date, end: Date): Promise<Array<{ date: string; close: number }>> {
  // Ensure ^GSPC asset exists
  const existing = await prisma.asset.findUnique({ where: { ticker: '^GSPC' } });
  if (!existing) {
    await createAssetFromTicker('^GSPC').catch(() => {});
  }
  const sp500 = await prisma.asset.findUnique({ where: { ticker: '^GSPC' } });
  if (!sp500) return [];
  await syncAssetHistoricalData(sp500.id, start, end).catch(() => {});
  const hist = await getAssetHistoricalData(sp500.id, start, end);
  return hist
    .map(h => ({ date: new Date(h.date as any).toISOString(), close: (h.close as number) ?? (h.adjustedClose as number) ?? 0 }))
    .filter(h => !!h.close)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function toPercentSeries(domain: string[], values: Array<{ date: string; value: number }>, baseOverride?: number | null): Array<number | null> {
  // Map date->value with carry-forward
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v.date.slice(0, 10);
    map.set(key, v.value);
  }
  // find base (first non-null)
  let last: number | null = null;
  let base: number | null = baseOverride ?? null;
  const result: Array<number | null> = [];
  for (const iso of domain) {
    const key = iso.slice(0, 10);
    const val = map.has(key) ? (map.get(key) as number) : null;
    if (val !== null) {
      last = val;
      if (base === null) base = val;
    }
    if (last === null || base === null || base === 0) {
      result.push(null);
    } else {
      result.push(((last / base) - 1) * 100);
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Get user's active portfolio and session
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      include: { gameSession: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!portfolio || !portfolio.gameSession) {
      return NextResponse.json({ success: true, data: { points: [] }, meta: { sessionId: '', startDate: '', endDate: '', leaderUserId: null, leaderName: null, dataPoints: 0 } });
    }

    const start = new Date(portfolio.gameSession.startDate);
    const today = new Date();
    const end = new Date(Math.min(today.getTime(), new Date(portfolio.gameSession.endDate).getTime()));

    // Build domain (calendar days)
    const domain = buildTradingDayDomain(start, end);

    // Compute user daily values
    const youValuesRaw = await computePortfolioDailyValues(portfolio.id, start, end);
    const youSeries = toPercentSeries(domain, youValuesRaw.map(p => ({ date: p.date, value: p.total })), Number(portfolio.gameSession.startingCash));

    // Identify leader within same session (highest current total value)
    const portfoliosInSession = await prisma.portfolio.findMany({
      where: { sessionId: portfolio.sessionId },
      include: { user: true, holdings: { include: { asset: true } } },
    });

    let leaderUserId: string | null = null;
    let leaderName: string | null = null;
    let leaderPortfolioId: string | null = null;

    let bestValue = -Infinity;
    for (const pf of portfoliosInSession) {
      // current value = cash + sum(qty * latest price from cache if present, else skip)
      let total = pf.cash_balance;
      for (const h of pf.holdings) {
        const cache = await prisma.assetQuoteCache.findUnique({ where: { assetId: h.assetId } });
        const price = cache?.regularMarketPrice || 0;
        total += h.quantity * price;
      }
      if (total > bestValue) {
        bestValue = total;
        leaderUserId = pf.userId;
        leaderName = pf.user?.name || pf.user?.email?.split('@')[0] || 'Leader';
        leaderPortfolioId = pf.id;
      }
    }

    // Leader series (optional)
    let leaderSeries: Array<number | null> = new Array(domain.length).fill(null);
    if (leaderPortfolioId) {
      const leaderValuesRaw = await computePortfolioDailyValues(leaderPortfolioId, start, end);
      // Use the same session starting cash as baseline to prevent base drift
      leaderSeries = toPercentSeries(domain, leaderValuesRaw.map(p => ({ date: p.date, value: p.total })), Number(portfolio.gameSession.startingCash));
    }

    // S&P 500 series
    const spRaw = await getSp500Series(start, end);
    const spMapValues = spRaw.map(p => ({ date: p.date, value: p.close }));
    const spSeries = toPercentSeries(domain, spMapValues, null);

    // Smoothing strategy for noisy start: find first day where absolute change is within a small band
    // and backfill earlier days with 0 to visually start at baseline.
    const clampIndex = (() => {
      const threshold = 0.5; // 0.5% band
      for (let i = 0; i < youSeries.length; i++) {
        const v = youSeries[i];
        if (v !== null && Math.abs(v) <= threshold) return i;
      }
      return 0;
    })();

    const points = domain.map((iso, i) => ({
      date: iso,
      youPct: i < clampIndex ? 0 : (youSeries[i] !== null ? Number((youSeries[i] as number).toFixed(4)) : null),
      leaderPct: i < clampIndex ? 0 : (leaderSeries[i] !== null ? Number((leaderSeries[i] as number).toFixed(4)) : null),
      sp500Pct: i < clampIndex ? 0 : (spSeries[i] !== null ? Number((spSeries[i] as number).toFixed(4)) : null),
    }));

    return NextResponse.json({
      success: true,
      data: { points },
      meta: {
        sessionId: portfolio.sessionId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        leaderUserId,
        leaderName,
        dataPoints: points.length,
      }
    });
  } catch (error: any) {
    console.error('performance-series error', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load performance series' }, { status: 500 });
  }
}


