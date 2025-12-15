import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../../prisma/client';
import { getAssetHistoricalData, syncAssetHistoricalData } from '@/lib/yahoo-finance-service';

type CategoryKey = 'stocks' | 'bonds' | 'mutualFunds' | 'cash';

function parseRange(range: string | null): { start: Date; end: Date; interval: '1d' } {
  const end = new Date();
  const start = new Date(end);
  switch (range) {
    case '1d':
      start.setDate(end.getDate() - 1);
      break;
    case '1w':
      start.setDate(end.getDate() - 7);
      break;
    case '1m':
      start.setMonth(end.getMonth() - 1);
      break;
    case '3m':
      start.setMonth(end.getMonth() - 3);
      break;
    case '6m':
      start.setMonth(end.getMonth() - 6);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'ytd':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'max':
      start.setFullYear(end.getFullYear() - 5);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
  }
  return { start, end, interval: '1d' };
}

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

function mapAssetTypeToCategory(type: string): Exclude<CategoryKey, 'cash'> | null {
  const t = type?.toUpperCase();
  if (t === 'STOCK' || t === 'ETF') return 'stocks';
  if (t === 'BOND') return 'bonds';
  if (t === 'MUTUAL_FUND' || t === 'MUTUALFUND' || t === 'FUND') return 'mutualFunds';
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range');
    let { start, end } = parseRange(range);

    // Find the user's single active portfolio (assumption: one portfolio per user)
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      include: {
        gameSession: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!portfolio) {
      return NextResponse.json({ success: true, data: { points: [] }, meta: { userId: user.id, portfolioId: '', range: range || '1m', interval: '1d', startDate: start.toISOString(), endDate: end.toISOString(), dataPoints: 0 } });
    }

    // Anchor start date to the session start if later than requested window start
    if (portfolio.gameSession?.startDate) {
      const sessionStart = new Date(portfolio.gameSession.startDate);
      if (sessionStart < end && sessionStart > start) {
        start = sessionStart;
      }
    }

    // Get all transactions for the portfolio up to end date to reconstruct quantities
    const transactions = await prisma.transaction.findMany({
      where: {
        portfolioId: portfolio.id,
        date: { lte: end },
      },
      orderBy: { date: 'asc' },
      select: { date: true, type: true, quantity: true, total: true, assetId: true, asset: { select: { id: true, type: true } } },
    });

    // Build running share counts per asset over time
    const assetIds = Array.from(new Set(transactions.map(t => t.assetId)));

    // Pre-fetch historical closes for each asset across the date range
    // Store as sorted arrays and use carry-forward to handle timezone/date mismatches
    const historicalByAsset: Record<number, Array<{ date: Date; price: number }>> = {};
    for (const assetId of assetIds) {
      // Ensure data exists
      await syncAssetHistoricalData(assetId, start, end).catch(() => {});
      const hist = await getAssetHistoricalData(assetId, start, end);

      const arr: Array<{ date: Date; price: number }> = hist
        .map(h => ({
          date: new Date(h.date as any),
          price: (h.close as number) ?? (h.adjustedClose as number) ?? 0,
        }))
        .filter(h => !!h.price)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      historicalByAsset[assetId] = arr;
    }

    // Running quantities per asset as we walk through days
    const runningQty: Record<number, number> = {};
    let txIndex = 0;

    // Prepare daily cash using cash flows from transactions
    // Start from session startingCash when available, else derive from portfolio.cash_balance + invested value
    let startingCash = portfolio.gameSession?.startingCash ? Number(portfolio.gameSession.startingCash) : Number(portfolio.cash_balance);
    const dailyCash: Record<string, number> = {};
    let cashCursor = startingCash;

    // Precompute transaction flows per day (BUY decreases cash by total; SELL increases by total)
    const txsByDay: Record<string, { buy: number; sell: number }> = {};
    for (const tx of transactions) {
      const k = new Date(tx.date).toISOString().slice(0, 10);
      if (!txsByDay[k]) txsByDay[k] = { buy: 0, sell: 0 };
      if (tx.type.toUpperCase() === 'BUY') txsByDay[k].buy += Number(tx.total);
      else txsByDay[k].sell += Number(tx.total);
    }

    // Build trading-day domain: union of available historical dates across held assets
    const tradingDaysSet = new Set<string>();
    for (const assetId of assetIds) {
      const arr = historicalByAsset[assetId] || [];
      for (const h of arr) {
        const d = new Date(h.date);
        if (d >= start && d <= end) tradingDaysSet.add(d.toISOString().slice(0, 10));
      }
    }
    const tradingDays = Array.from(tradingDaysSet)
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const points = tradingDays.map(day => {
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      // Apply all transactions up to dayEnd
      while (txIndex < transactions.length && new Date(transactions[txIndex].date) <= dayEnd) {
        const tx = transactions[txIndex];
        const sign = tx.type.toUpperCase() === 'BUY' ? 1 : -1; // BUY increases quantity; SELL decreases
        runningQty[tx.assetId] = (runningQty[tx.assetId] || 0) + sign * tx.quantity;
        txIndex++;
      }

      const values: Record<CategoryKey, number> = { stocks: 0, bonds: 0, mutualFunds: 0, cash: 0 };

      // Update cash by applying this day's net flows
      const keyDay = day.toISOString().slice(0, 10);
      const flows = txsByDay[keyDay];
      if (flows) {
        cashCursor = cashCursor - (flows.buy || 0) + (flows.sell || 0);
      }
      dailyCash[keyDay] = cashCursor;
      values.cash = cashCursor;

      const key = keyDay;
      for (const assetId of assetIds) {
        const qty = runningQty[assetId] || 0;
        if (qty === 0) continue;
        const histArr = historicalByAsset[assetId] || [];
        if (histArr.length === 0) continue;
        // Find last known price on or before end of this day (carry-forward)
        let price = 0;
        // Binary search could be used; linear scan is acceptable for small demo ranges
        for (let i = histArr.length - 1; i >= 0; i--) {
          if (histArr[i].date.getTime() <= dayEnd.getTime()) { price = histArr[i].price; break; }
        }
        if (price === 0) continue;
        const type = transactions.find(t => t.assetId === assetId)?.asset?.type || 'STOCK';
        const cat = mapAssetTypeToCategory(type);
        if (!cat) continue;
        values[cat] += qty * price;
      }

      const total = values.stocks + values.bonds + values.mutualFunds + values.cash;
      return {
        date: day.toISOString(),
        stocks: Number(values.stocks.toFixed(2)),
        bonds: Number(values.bonds.toFixed(2)),
        mutualFunds: Number(values.mutualFunds.toFixed(2)),
        cash: Number(values.cash.toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    });

    return NextResponse.json({
      success: true,
      data: { points },
      meta: {
        userId: user.id,
        portfolioId: portfolio.id,
        range: range || '1m',
        interval: '1d',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        dataPoints: points.length,
      },
    });
  } catch (error: any) {
    console.error('category-series error', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load category series' }, { status: 500 });
  }
}


