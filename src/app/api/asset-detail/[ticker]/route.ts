import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Decimal from 'decimal.js';
import { FinancialMath } from '@/lib/financial';
import { getAssetQuoteWithCache, createAssetFromTicker, syncAssetProfile, getChartDataDirect, getAnalystConsensus } from '@/lib/yahoo-finance-service';
import {
  getBenchmarkTickerForAsset,
  mapChartToCloseSeries,
  computeDailyReturns,
  annualizeVolatility,
  maxDrawdown,
  betaVsBenchmark,
  sharpeRatio,
  positionInRange,
  downsideDaysPct,
  approximateDuration,
  safeNumber,
} from '@/lib/risk-metrics-service';

// Simple in-memory cache for risk measures (per server instance)
const RISK_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RISK_CACHE = new Map<string, { data: any; expiresAt: number }>();
import { prisma } from '@/prisma/client';

/**
 * Helper function to get authenticated user from session cookie
 */
async function getAuthenticatedUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    
    if (!sessionCookie) {
      return null;
    }

    return JSON.parse(sessionCookie.value);
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/asset/[ticker]
 * Get comprehensive asset details including quote data, asset info, and user holdings if authenticated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const upperTicker = ticker.toUpperCase();

    // Get authenticated user (optional)
    const user = await getAuthenticatedUser();

    // Find or create asset
    let asset = await prisma.asset.findUnique({
      where: { ticker: upperTicker },
      include: { 
        stock: true, 
        bond: true, 
        mutualFund: true,
        profile: true
      }
    });

    if (!asset) {
      try {
        await createAssetFromTicker(upperTicker);
        // Re-fetch with relations
        asset = await prisma.asset.findUnique({
          where: { ticker: upperTicker },
          include: { 
            stock: true, 
            bond: true, 
            mutualFund: true,
            profile: true
          }
        });
      } catch (error: any) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Asset not found and could not be created: ${error.message}` 
          },
          { status: 404 }
        );
      }
    }

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Get real-time quote data
    const quoteData = await getAssetQuoteWithCache(asset.id);
    
    // Get analyst consensus data (for stocks only)
    let analystConsensus = null;
    if (asset.type === 'STOCK') {
      analystConsensus = await getAnalystConsensus(asset.ticker);
    }

    // Get user holdings if authenticated
    let userHoldings = null;
    if (user) {
      const holdings = await prisma.holding.findMany({
        where: {
          assetId: asset.id,
          portfolio: {
            userId: user.id
          }
        },
        include: {
          portfolio: {
            select: {
              id: true,
              name: true,
              gameSession: {
                select: {
                  id: true,
                  name: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      if (holdings.length > 0) {
        // Use FinancialMath for all money calculations to ensure precision
        const totalQuantity = holdings.reduce(
          (sum, h) => FinancialMath.add(sum, h.quantity),
          new Decimal(0)
        );
        
        const totalCostBasis = holdings.reduce(
          (sum, h) => FinancialMath.add(
            sum,
            FinancialMath.multiply(h.quantity, h.averagePrice)
          ),
          new Decimal(0)
        );
        
        const avgCostBasis = FinancialMath.divide(totalCostBasis, totalQuantity);
        const currentValue = FinancialMath.multiply(totalQuantity, quoteData.regularMarketPrice);
        const unrealizedPnL = FinancialMath.subtract(currentValue, totalCostBasis);
        const unrealizedPnLPercent = FinancialMath.multiply(
          FinancialMath.divide(unrealizedPnL, totalCostBasis),
          100
        );

        userHoldings = {
          totalQuantity: totalQuantity.toNumber(),
          avgCostBasis: avgCostBasis.toNumber(),
          totalCostBasis: totalCostBasis.toNumber(),
          currentValue: currentValue.toNumber(),
          unrealizedPnL: unrealizedPnL.toNumber(),
          unrealizedPnLPercent: unrealizedPnLPercent.toNumber(),
          holdings: holdings.map(h => {
            const holdingCostBasis = FinancialMath.multiply(h.quantity, h.averagePrice);
            const holdingCurrentValue = FinancialMath.multiply(h.quantity, quoteData.regularMarketPrice);
            const holdingUnrealizedPnL = FinancialMath.subtract(holdingCurrentValue, holdingCostBasis);
            
            return {
              id: h.id,
              quantity: h.quantity,
              averagePrice: h.averagePrice,
              costBasis: holdingCostBasis.toNumber(),
              currentValue: holdingCurrentValue.toNumber(),
              unrealizedPnL: holdingUnrealizedPnL.toNumber(),
              portfolio: h.portfolio
            };
          })
        };
      }
    }

    // Ensure we have a profile description; if missing, try to sync it in the background
    if (!asset.profile?.description) {
      try {
        // Fire and forget; we won't block the response
        // eslint-disable-next-line no-unused-vars
        const _ = syncAssetProfile(asset.id).catch(() => {});
      } catch {}
    }

    // Compute risk measures (best-effort, non-blocking if failures) with caching
    let riskMeasures: any | undefined = undefined;
    try {
      const cacheKey = upperTicker;
      const cached = RISK_CACHE.get(cacheKey);
      const nowMs = Date.now();
      if (cached && cached.expiresAt > nowMs) {
        riskMeasures = cached.data;
      } else {
        const now = new Date();
        const start = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000); // ~400 days for safety

        // Fetch asset and benchmark daily series in parallel
        const fundType = (asset.mutualFund as any)?.fundType || undefined;
        const benchmarkTicker = getBenchmarkTickerForAsset(asset.type, fundType);
        const [assetChart, benchChart] = await Promise.all([
          getChartDataDirect(asset.ticker, start, now, '1d'),
          getChartDataDirect(benchmarkTicker, start, now, '1d').catch(() => null),
        ]);

        const assetSeries = assetChart?.success ? mapChartToCloseSeries(assetChart.data) : [];
        const benchSeries = benchChart && benchChart.success ? mapChartToCloseSeries(benchChart.data) : [];

        // Helper: normalize to YYYY-MM-DD for alignment
        const toDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
        const assetMap = new Map(assetSeries.map(p => [toDay(p.date), p.close]));
        const benchMap = new Map(benchSeries.map(p => [toDay(p.date), p.close]));
        const commonDays = assetSeries
          .map(p => toDay(p.date))
          .filter(day => benchMap.has(day));
        // Build aligned closes for beta
        const alignedAssetCloses: number[] = [];
        const alignedBenchCloses: number[] = [];
        for (const day of commonDays) {
          const ac = assetMap.get(day)!;
          const bc = benchMap.get(day)!;
          if (typeof ac === 'number' && typeof bc === 'number' && ac > 0 && bc > 0) {
            alignedAssetCloses.push(ac);
            alignedBenchCloses.push(bc);
          }
        }

        // Compute returns
        const assetCloses = assetSeries.map(p => p.close).filter(v => typeof v === 'number' && v > 0);
        const dailyReturnsAll = computeDailyReturns(assetCloses);
        const dailyReturns30 = dailyReturnsAll.slice(-30);
        const dailyReturns90 = dailyReturnsAll.slice(-90);

        // Common metrics
        const volatility30d = annualizeVolatility(dailyReturns30);
        const volatility90d = annualizeVolatility(dailyReturns90);
        const maxDD1y = maxDrawdown(assetSeries.slice(-252));
        const rangePos = positionInRange(
          safeNumber(quoteData.regularMarketPrice) ?? null,
          safeNumber(quoteData.fiftyTwoWeekLow) ?? null,
          safeNumber(quoteData.fiftyTwoWeekHigh) ?? null
        );
        const downside90 = downsideDaysPct(dailyReturns90);
        const sharpe90 = sharpeRatio(dailyReturns90);

        const common = {
          volatility30d: volatility30d,
          volatility90d: volatility90d,
          maxDrawdown1y: assetSeries.length > 0 ? maxDD1y.value : null,
          range52wPosition: rangePos,
          downsideDays90dPct: downside90,
          sharpe90d: sharpe90,
        };

        // Type-specific
        const type = asset.type;
        const risk: any = { common };

        if (type === 'STOCK') {
          const assetRetAligned = computeDailyReturns(alignedAssetCloses);
          const benchRetAligned = computeDailyReturns(alignedBenchCloses);
          const betaCalc = (assetRetAligned.length && benchRetAligned.length)
            ? betaVsBenchmark(assetRetAligned, benchRetAligned)
            : null;
          risk.stock = {
            beta: betaCalc ?? asset.profile?.beta ?? quoteData.beta ?? null,
            trailingPE: safeNumber(quoteData.trailingPE),
            forwardPE: safeNumber(quoteData.forwardPE),
            dividendYield: safeNumber(quoteData.dividendYield),
          };
        } else if (type === 'ETF' || type === 'INDEX' || type === 'MUTUAL_FUND') {
          const expenseRatio = (asset.mutualFund as any)?.expenseRatio ?? null; // when modeled under mutualFund table
          if (type === 'ETF') risk.etf = { expenseRatio: expenseRatio ?? null };
          else if (type === 'MUTUAL_FUND') risk.fund = { expenseRatio: expenseRatio ?? null };
          else risk.index = {};
        } else if (type === 'BOND') {
          const b = asset.bond as any;
          const maturityYears = (b?.maturityDate && b?.issueDate)
            ? Math.max(0, (new Date(b.maturityDate).getTime() - new Date(b.issueDate).getTime()) / (365 * 24 * 60 * 60 * 1000))
            : null;
          const durationApprox = approximateDuration(
            safeNumber(b?.couponRate),
            safeNumber(b?.yieldToMaturity),
            maturityYears
          );
          risk.bond = {
            durationApprox: durationApprox,
            yieldToMaturity: safeNumber(b?.yieldToMaturity),
          };
        }

        riskMeasures = risk;
        RISK_CACHE.set(cacheKey, { data: riskMeasures, expiresAt: nowMs + RISK_CACHE_TTL_MS });
      }
    } catch (e) {
      console.warn('Risk measure computation failed; continuing without it:', e);
    }

    // Prepare comprehensive response
    const response = {
      success: true,
      data: {
        asset: {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          market: asset.market,
          locale: asset.locale,
          primaryExchange: asset.primaryExchange,
          active: asset.active,
          currencyName: asset.currencyName,
          logoUrl: asset.logoUrl,
          allowFractionalShares: asset.allowFractionalShares,
          lastUpdated: asset.lastUpdated
        },
        quote: {
          regularMarketPrice: quoteData.regularMarketPrice,
          currency: quoteData.currency,
          regularMarketChange: quoteData.regularMarketChange,
          regularMarketChangePercent: quoteData.regularMarketChangePercent,
          regularMarketPreviousClose: quoteData.regularMarketPreviousClose,
          regularMarketOpen: quoteData.regularMarketOpen,
          regularMarketDayLow: quoteData.regularMarketDayLow,
          regularMarketDayHigh: quoteData.regularMarketDayHigh,
          regularMarketVolume: quoteData.regularMarketVolume?.toString(),
          marketCap: quoteData.marketCap?.toString(),
          fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
          beta: asset.profile?.beta ?? quoteData.beta,
          trailingPE: quoteData.trailingPE,
          forwardPE: quoteData.forwardPE,
          dividendYield: quoteData.dividendYield,
          earningsPerShare: quoteData.earningsPerShare,
          bookValue: quoteData.bookValue,
          priceToBook: quoteData.priceToBook,
          exchangeName: quoteData.exchangeName,
          marketState: quoteData.marketState,
          isCached: quoteData.isCached,
          cacheAge: quoteData.cacheAge,
          analystConsensus: analystConsensus
        },
        // Include type-specific data
        typeSpecific: {
          stock: asset.stock,
          bond: asset.bond,
          mutualFund: asset.mutualFund
        },
        profile: asset.profile ? {
          ...asset.profile,
          // Convert BigInt fields to strings for JSON serialization
          marketCap: asset.profile.marketCap?.toString() || null,
          enterpriseValue: asset.profile.enterpriseValue?.toString() || null,
          totalRevenue: asset.profile.totalRevenue?.toString() || null,
          totalDebt: asset.profile.totalDebt?.toString() || null,
          totalCash: asset.profile.totalCash?.toString() || null,
          operatingCashflow: asset.profile.operatingCashflow?.toString() || null,
        } : null,
        userHoldings,
        authenticated: !!user,
        riskMeasures
      },
      timestamp: new Date().toISOString(),
      meta: {
        ticker: upperTicker,
        assetId: asset.id,
        assetType: asset.type,
        userId: user?.id,
        cacheAge: quoteData.cacheAge,
        hasUserHoldings: !!userHoldings
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`Error fetching asset details for ${(await params).ticker}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch asset details' 
      },
      { status: 500 }
    );
  }
} 