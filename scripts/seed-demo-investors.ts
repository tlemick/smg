#!/usr/bin/env tsx

/*
  Seed 10 demo users and backdate trades to Day 1 of the active game session.
  - Ensures a single active game session is used by all users
  - Seeds a mix of STOCK, BOND, and MUTUAL_FUND assets with quote caches
  - Creates portfolios for each user in the active session
  - Trades ~85-95% of starting cash across diversified assets
  - Backdates Transactions, Holdings, and Activities to the session start date

  Usage:
    tsx scripts/seed-demo-investors.ts

  Note: This script is for demo environments. Passwords are plain text.
*/

import { syncAssetHistoricalData, getAssetQuoteWithCache, getAssetHistoricalData } from '../src/lib/yahoo-finance-service';
import { prisma } from '../prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

type SeedAsset = {
  ticker: string;
  name: string;
  type: 'STOCK' | 'BOND' | 'MUTUAL_FUND' | 'ETF';
  extra?: Record<string, any>;
};

const seedAssets: SeedAsset[] = [
  // Stocks (~70% of typical portfolio) - Expanded list for diversity
  { ticker: 'AAPL', name: 'Apple Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Consumer Electronics' } },
  { ticker: 'MSFT', name: 'Microsoft Corporation', type: 'STOCK', extra: { sector: 'Technology', industry: 'Software' } },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Interactive Media' } },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'E-commerce' } },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', type: 'STOCK', extra: { sector: 'Technology', industry: 'Semiconductors' } },
  { ticker: 'META', name: 'Meta Platforms Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Social Media' } },
  { ticker: 'TSLA', name: 'Tesla, Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Automotive' } },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', type: 'STOCK', extra: { sector: 'Financials', industry: 'Banks' } },
  { ticker: 'V', name: 'Visa Inc.', type: 'STOCK', extra: { sector: 'Financials', industry: 'Payment Processing' } },
  { ticker: 'JNJ', name: 'Johnson & Johnson', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Pharmaceuticals' } },
  { ticker: 'WMT', name: 'Walmart Inc.', type: 'STOCK', extra: { sector: 'Consumer Staples', industry: 'Retail' } },
  { ticker: 'PG', name: 'Procter & Gamble Co.', type: 'STOCK', extra: { sector: 'Consumer Staples', industry: 'Consumer Goods' } },
  { ticker: 'MA', name: 'Mastercard Inc.', type: 'STOCK', extra: { sector: 'Financials', industry: 'Payment Processing' } },
  { ticker: 'UNH', name: 'UnitedHealth Group Inc.', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Insurance' } },
  { ticker: 'HD', name: 'The Home Depot, Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Retail' } },
  { ticker: 'DIS', name: 'The Walt Disney Company', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Entertainment' } },
  { ticker: 'NFLX', name: 'Netflix, Inc.', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Streaming' } },
  { ticker: 'AMD', name: 'Advanced Micro Devices, Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Semiconductors' } },
  { ticker: 'INTC', name: 'Intel Corporation', type: 'STOCK', extra: { sector: 'Technology', industry: 'Semiconductors' } },
  { ticker: 'CRM', name: 'Salesforce, Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Software' } },
  { ticker: 'CSCO', name: 'Cisco Systems, Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Networking' } },
  { ticker: 'PEP', name: 'PepsiCo, Inc.', type: 'STOCK', extra: { sector: 'Consumer Staples', industry: 'Beverages' } },
  { ticker: 'KO', name: 'The Coca-Cola Company', type: 'STOCK', extra: { sector: 'Consumer Staples', industry: 'Beverages' } },
  { ticker: 'NKE', name: 'Nike, Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Apparel' } },
  { ticker: 'ABBV', name: 'AbbVie Inc.', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Pharmaceuticals' } },
  { ticker: 'BAC', name: 'Bank of America Corp.', type: 'STOCK', extra: { sector: 'Financials', industry: 'Banks' } },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', type: 'STOCK', extra: { sector: 'Energy', industry: 'Oil & Gas' } },
  { ticker: 'CVX', name: 'Chevron Corporation', type: 'STOCK', extra: { sector: 'Energy', industry: 'Oil & Gas' } },
  { ticker: 'COST', name: 'Costco Wholesale Corporation', type: 'STOCK', extra: { sector: 'Consumer Staples', industry: 'Retail' } },
  { ticker: 'AVGO', name: 'Broadcom Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Semiconductors' } },
  { ticker: 'SPOT', name: 'Spotify Technology S.A.', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Streaming' } },
  { ticker: 'TTWO', name: 'Take-Two Interactive Software, Inc.', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Interactive Entertainment' } },
  { ticker: 'RBLX', name: 'Roblox Corporation', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Interactive Entertainment' } },
  { ticker: 'CMG', name: 'Chipotle Mexican Grill, Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Restaurants' } },
  { ticker: 'ELF', name: 'e.l.f. Beauty, Inc.', type: 'STOCK', extra: { sector: 'Consumer Staples', industry: 'Personal Care' } },
  { ticker: 'CELH', name: 'Celsius Holdings, Inc.', type: 'STOCK', extra: { sector: 'Consumer Staples', industry: 'Beverages' } },
  { ticker: 'SBUX', name: 'Starbucks Corporation', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Restaurants' } },
  { ticker: 'SNAP', name: 'Snap Inc.', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Social Media' } },
  { ticker: 'LULU', name: 'Lululemon Athletica Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Apparel' } },
  
  // Additional Technology Stocks
  { ticker: 'ADBE', name: 'Adobe Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Software' } },
  { ticker: 'ORCL', name: 'Oracle Corporation', type: 'STOCK', extra: { sector: 'Technology', industry: 'Software' } },
  { ticker: 'IBM', name: 'International Business Machines Corp.', type: 'STOCK', extra: { sector: 'Technology', industry: 'IT Services' } },
  { ticker: 'NOW', name: 'ServiceNow, Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Software' } },
  { ticker: 'SNOW', name: 'Snowflake Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Cloud Computing' } },
  { ticker: 'PLTR', name: 'Palantir Technologies Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Software' } },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings, Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Cybersecurity' } },
  { ticker: 'ZS', name: 'Zscaler, Inc.', type: 'STOCK', extra: { sector: 'Technology', industry: 'Cybersecurity' } },
  
  // Additional Healthcare Stocks
  { ticker: 'PFE', name: 'Pfizer Inc.', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Pharmaceuticals' } },
  { ticker: 'MRK', name: 'Merck & Co., Inc.', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Pharmaceuticals' } },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific Inc.', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Life Sciences' } },
  { ticker: 'DHR', name: 'Danaher Corporation', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Life Sciences' } },
  { ticker: 'ABT', name: 'Abbott Laboratories', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Medical Devices' } },
  { ticker: 'GILD', name: 'Gilead Sciences, Inc.', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Biotechnology' } },
  { ticker: 'BIIB', name: 'Biogen Inc.', type: 'STOCK', extra: { sector: 'Healthcare', industry: 'Biotechnology' } },
  
  // Additional Financial Stocks
  { ticker: 'GS', name: 'The Goldman Sachs Group, Inc.', type: 'STOCK', extra: { sector: 'Financials', industry: 'Investment Banking' } },
  { ticker: 'WFC', name: 'Wells Fargo & Company', type: 'STOCK', extra: { sector: 'Financials', industry: 'Banks' } },
  { ticker: 'C', name: 'Citigroup Inc.', type: 'STOCK', extra: { sector: 'Financials', industry: 'Banks' } },
  { ticker: 'SCHW', name: 'The Charles Schwab Corporation', type: 'STOCK', extra: { sector: 'Financials', industry: 'Brokerage' } },
  { ticker: 'BLK', name: 'BlackRock, Inc.', type: 'STOCK', extra: { sector: 'Financials', industry: 'Asset Management' } },
  
  // Additional Consumer Discretionary Stocks
  { ticker: 'TGT', name: 'Target Corporation', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Retail' } },
  { ticker: 'LOW', name: 'Lowe\'s Companies, Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Retail' } },
  { ticker: 'MCD', name: 'McDonald\'s Corporation', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Restaurants' } },
  { ticker: 'YUM', name: 'Yum! Brands, Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Restaurants' } },
  { ticker: 'BKNG', name: 'Booking Holdings Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'Travel' } },
  { ticker: 'EBAY', name: 'eBay Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'E-commerce' } },
  { ticker: 'SHOP', name: 'Shopify Inc.', type: 'STOCK', extra: { sector: 'Consumer Discretionary', industry: 'E-commerce' } },
  
  // Industrial Stocks
  { ticker: 'BA', name: 'The Boeing Company', type: 'STOCK', extra: { sector: 'Industrials', industry: 'Aerospace' } },
  { ticker: 'CAT', name: 'Caterpillar Inc.', type: 'STOCK', extra: { sector: 'Industrials', industry: 'Machinery' } },
  { ticker: 'GE', name: 'General Electric Company', type: 'STOCK', extra: { sector: 'Industrials', industry: 'Conglomerate' } },
  { ticker: 'HON', name: 'Honeywell International Inc.', type: 'STOCK', extra: { sector: 'Industrials', industry: 'Conglomerate' } },
  { ticker: 'RTX', name: 'RTX Corporation', type: 'STOCK', extra: { sector: 'Industrials', industry: 'Aerospace & Defense' } },
  { ticker: 'LMT', name: 'Lockheed Martin Corporation', type: 'STOCK', extra: { sector: 'Industrials', industry: 'Aerospace & Defense' } },
  
  // Additional Energy Stocks
  { ticker: 'SLB', name: 'Schlumberger Limited', type: 'STOCK', extra: { sector: 'Energy', industry: 'Oil Services' } },
  { ticker: 'COP', name: 'ConocoPhillips', type: 'STOCK', extra: { sector: 'Energy', industry: 'Oil & Gas' } },
  { ticker: 'EOG', name: 'EOG Resources, Inc.', type: 'STOCK', extra: { sector: 'Energy', industry: 'Oil & Gas' } },
  
  // Additional Communication Services Stocks
  { ticker: 'T', name: 'AT&T Inc.', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Telecom' } },
  { ticker: 'VZ', name: 'Verizon Communications Inc.', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Telecom' } },
  { ticker: 'CHTR', name: 'Charter Communications, Inc.', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Cable' } },
  { ticker: 'PARA', name: 'Paramount Global', type: 'STOCK', extra: { sector: 'Communication Services', industry: 'Entertainment' } },
  
  // Real Estate Stocks
  { ticker: 'AMT', name: 'American Tower Corporation', type: 'STOCK', extra: { sector: 'Real Estate', industry: 'REIT' } },
  { ticker: 'PLD', name: 'Prologis, Inc.', type: 'STOCK', extra: { sector: 'Real Estate', industry: 'REIT' } },
  { ticker: 'EQIX', name: 'Equinix, Inc.', type: 'STOCK', extra: { sector: 'Real Estate', industry: 'REIT' } },
  
  // Utilities Stocks
  { ticker: 'NEE', name: 'NextEra Energy, Inc.', type: 'STOCK', extra: { sector: 'Utilities', industry: 'Electric Utilities' } },
  { ticker: 'DUK', name: 'Duke Energy Corporation', type: 'STOCK', extra: { sector: 'Utilities', industry: 'Electric Utilities' } },
  { ticker: 'SO', name: 'The Southern Company', type: 'STOCK', extra: { sector: 'Utilities', industry: 'Electric Utilities' } },
  
  // Materials Stocks
  { ticker: 'LIN', name: 'Linde plc', type: 'STOCK', extra: { sector: 'Materials', industry: 'Chemicals' } },
  { ticker: 'APD', name: 'Air Products and Chemicals, Inc.', type: 'STOCK', extra: { sector: 'Materials', industry: 'Chemicals' } },
  { ticker: 'SHW', name: 'The Sherwin-Williams Company', type: 'STOCK', extra: { sector: 'Materials', industry: 'Chemicals' } },
  
  // ETFs - Equity (~20% of typical portfolio)
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'ETF', extra: { fundType: 'Equity ETF', category: 'Large Cap', expenseRatio: 0.0009 } },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', extra: { fundType: 'Equity ETF', category: 'Technology', expenseRatio: 0.0020 } },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF', extra: { fundType: 'Equity ETF', category: 'Total Market', expenseRatio: 0.0003 } },
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF', type: 'ETF', extra: { fundType: 'Equity ETF', category: 'Small Cap', expenseRatio: 0.0019 } },
  { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', type: 'ETF', extra: { fundType: 'Equity ETF', category: 'International', expenseRatio: 0.0005 } },
  
  // ETFs - Bond (~10% of typical portfolio)
  { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'ETF', extra: { fundType: 'Bond ETF', category: 'Long-Term Treasury', expenseRatio: 0.0015 } },
  { ticker: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', type: 'ETF', extra: { fundType: 'Bond ETF', category: 'Aggregate Bond', expenseRatio: 0.0004 } },
  { ticker: 'LQD', name: 'iShares iBoxx $ Inv Grade Corp Bd ETF', type: 'ETF', extra: { fundType: 'Bond ETF', category: 'Corporate Bond', expenseRatio: 0.0015 } },
];

const realisticUsers = [
  { name: 'Alex Johnson', email: 'alex.johnson@smg.com' },
  { name: 'Priya Patel', email: 'priya.patel@smg.com' },
  { name: 'Marcus Lee', email: 'marcus.lee@smg.com' },
  { name: 'Sofia Garcia', email: 'sofia.garcia@smg.com' },
  { name: 'Ethan Chen', email: 'ethan.chen@smg.com' },
  { name: 'Ava Thompson', email: 'ava.thompson@smg.com' },
  { name: 'Noah Williams', email: 'noah.williams@smg.com' },
  { name: 'Mia Robinson', email: 'mia.robinson@smg.com' },
  { name: 'Liam Davis', email: 'liam.davis@smg.com' },
  { name: 'Zoe Martinez', email: 'zoe.martinez@smg.com' },
  { name: 'Oliver Rodriguez', email: 'oliver.rodriguez@smg.com' },
  { name: 'Emma Lee', email: 'emma.lee@smg.com' },
  { name: 'Dimitrios Antos', email: 'dimitrios.antos@smg.com' },
  { name: 'Mike Macko', email: 'mike.macko@smg.com' },
  { name: 'Beau Davenport', email: 'beau.davenport@smg.com' },
  { name: 'Andrew Watterson', email: 'andrew.watterson@smg.com' },
  { name: 'Benjamin Williams', email: 'benjamin.williams@smg.com' },
];

const demoUsers = realisticUsers.map(u => ({ ...u, password: 'user123' }));

function getDayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(9, 30, 0, 0); // 9:30 AM session start for realism
  return d;
}

async function ensureActiveSession(): Promise<{ id: string; startingCash: number; startDate: Date }> {
  let session = await prisma.gameSession.findFirst({ where: { isActive: true } });
  if (!session) {
    // Demo-specific session window: start on June 30, 2025
    const startDate = new Date('2025-06-30T00:00:00Z');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 5);

    session = await prisma.gameSession.create({
      data: {
        name: 'Demo Session',
        description: 'Admin-created demo session for shared trading',
        startDate,
        endDate,
        startingCash: 100000,
        isActive: true,
      },
    });
  } else {
    // Align existing active session to demo window (June 30, 2025 start, 5 months duration)
    const desiredStart = new Date('2025-06-30T00:00:00Z');
    const desiredEnd = new Date(desiredStart);
    desiredEnd.setMonth(desiredEnd.getMonth() + 9);
    session = await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        startDate: desiredStart,
        endDate: desiredEnd,
      },
    });
  }
  return { id: session.id, startingCash: Number(session.startingCash), startDate: session.startDate };
}

async function ensureAssetsAndQuotes(sessionStartDate: Date): Promise<Record<string, number>> {
  const tickerToAssetId: Record<string, number> = {};

  console.log('\n💰 Extracting prices from historical data for session start date...');
  
  for (const a of seedAssets) {
    const asset = await prisma.asset.findUnique({ where: { ticker: a.ticker } });
    if (!asset) {
      console.warn(`  ⚠️  Asset ${a.ticker} not found in database, skipping`);
      continue;
    }

    // Look up real historical price on session start date from DailyAggregate table
    let realPrice = 0;
    try {
      const dayStart = new Date(sessionStartDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(sessionStartDate);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const hist = await getAssetHistoricalData(asset.id, dayStart, dayEnd);
      let histData = hist;
      
      // If no exact match (e.g., weekend), broaden the window by 14 days back
      if (!histData || histData.length === 0) {
        const back14 = new Date(dayStart);
        back14.setDate(back14.getDate() - 14);
        histData = await getAssetHistoricalData(asset.id, back14, dayEnd);
      }
      
      if (histData && histData.length > 0) {
        const sorted = histData
          .map(h => ({ date: new Date(h.date as any), close: (h.close as number) ?? (h.adjustedClose as number) ?? 0 }))
          .filter(h => h.close)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Get the last price on or before the session start date
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (sorted[i].date.getTime() <= dayEnd.getTime()) { 
            realPrice = sorted[i].close; 
            break; 
          }
        }
      }
    } catch (error) {
      console.warn(`  ⚠️  Could not fetch historical price for ${a.ticker}:`, (error as Error).message);
    }

    // Skip assets that we couldn't get prices for
    if (!realPrice || realPrice <= 0) {
      console.warn(`  ⚠️  Skipping ${a.ticker} - no valid price found in historical data`);
      continue;
    }

    console.log(`  ✓ ${a.ticker}: $${realPrice.toFixed(2)}`);

    // Create or update quote cache with real historical price
    const existingQuote = await prisma.assetQuoteCache.findUnique({ where: { assetId: asset.id } });
    if (!existingQuote) {
      await prisma.assetQuoteCache.create({
        data: {
          assetId: asset.id,
          regularMarketPrice: realPrice,
          currency: 'USD',
          marketState: 'REGULAR',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
    } else {
      await prisma.assetQuoteCache.update({
        where: { assetId: asset.id },
        data: { regularMarketPrice: realPrice, marketState: 'REGULAR', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      });
    }

    // Update MutualFund/ETF NAV if applicable
    if (a.type === 'MUTUAL_FUND' || a.type === 'ETF') {
      await prisma.mutualFund.update({
        where: { id: asset.id },
        data: { nav: realPrice },
      });
    }

    tickerToAssetId[a.ticker] = asset.id;
  }

  console.log(`\n✅ Successfully processed ${Object.keys(tickerToAssetId).length} assets with real prices`);
  return tickerToAssetId;
}

type Archetype = {
  name: string;
  investPctRange: [number, number]; // portion of cash invested
  weights: Record<string, number>; // ticker -> target weight
};

const ARCHETYPES: Archetype[] = [
  {
    name: 'Tech Growth',
    investPctRange: [0.92, 0.98],
    weights: { 
      AAPL: 0.12, MSFT: 0.12, NVDA: 0.12, META: 0.10, GOOGL: 0.08, AMZN: 0.08, 
      TSLA: 0.06, AMD: 0.05, CRM: 0.04, NFLX: 0.04, 
      QQQ: 0.12, SPY: 0.05, TLT: 0.02 
    },
  },
  {
    name: 'Diversified Growth',
    investPctRange: [0.85, 0.95],
    weights: { 
      AAPL: 0.08, MSFT: 0.08, GOOGL: 0.07, JPM: 0.06, V: 0.06, MA: 0.05,
      JNJ: 0.05, WMT: 0.05, HD: 0.04, NVDA: 0.04, PG: 0.04, UNH: 0.04,
      SPY: 0.15, VTI: 0.10, AGG: 0.05, TLT: 0.04
    },
  },
  {
    name: 'Value Investor',
    investPctRange: [0.82, 0.92],
    weights: { 
      JPM: 0.08, BAC: 0.07, WMT: 0.08, PG: 0.07, KO: 0.06, PEP: 0.06,
      JNJ: 0.07, ABBV: 0.06, XOM: 0.06, CVX: 0.05, INTC: 0.05, CSCO: 0.05,
      SPY: 0.12, VTI: 0.08, AGG: 0.04
    },
  },
  {
    name: 'Mega Cap Focus',
    investPctRange: [0.88, 0.96],
    weights: { 
      AAPL: 0.15, MSFT: 0.15, GOOGL: 0.12, AMZN: 0.10, META: 0.08, TSLA: 0.08,
      NVDA: 0.08, UNH: 0.04, AVGO: 0.03, COST: 0.02,
      QQQ: 0.10, AGG: 0.03, TLT: 0.02
    },
  },
  {
    name: 'Sector Spread',
    investPctRange: [0.85, 0.94],
    weights: { 
      MSFT: 0.06, AAPL: 0.06, NVDA: 0.05, JPM: 0.06, V: 0.05, BAC: 0.04,
      JNJ: 0.06, UNH: 0.05, WMT: 0.05, COST: 0.04, HD: 0.05, NKE: 0.04,
      DIS: 0.04, XOM: 0.05, PG: 0.04, KO: 0.03,
      SPY: 0.10, VTI: 0.08, AGG: 0.03, TLT: 0.02
    },
  },
  {
    name: 'Blue Chip Heavy',
    investPctRange: [0.80, 0.90],
    weights: { 
      AAPL: 0.10, MSFT: 0.10, JPM: 0.08, JNJ: 0.08, WMT: 0.07, PG: 0.06,
      KO: 0.05, PEP: 0.05, V: 0.06, MA: 0.05,
      SPY: 0.15, VTI: 0.08, AGG: 0.05, LQD: 0.02
    },
  },
  {
    name: 'Aggressive All-In',
    investPctRange: [0.93, 0.99],
    weights: { 
      TSLA: 0.10, NVDA: 0.10, META: 0.09, NFLX: 0.08, AMD: 0.08, AMZN: 0.08,
      AAPL: 0.07, MSFT: 0.07, GOOGL: 0.06, CRM: 0.05, AVGO: 0.04,
      QQQ: 0.15, AGG: 0.02, TLT: 0.01
    },
  },
  {
    name: 'Balanced Portfolio',
    investPctRange: [0.78, 0.88],
    weights: { 
      AAPL: 0.07, MSFT: 0.07, GOOGL: 0.06, JPM: 0.06, JNJ: 0.06,
      WMT: 0.05, V: 0.05, PG: 0.05, UNH: 0.05, HD: 0.04,
      NVDA: 0.04, MA: 0.04, DIS: 0.03,
      SPY: 0.12, VTI: 0.08, AGG: 0.06, LQD: 0.04, TLT: 0.03
    },
  },
];

function pickAllocationsForUser(userIndex: number, startingCash: number): Array<{ ticker: string; amount: number }> {
  // Choose archetype by cycling across users
  const archetype = ARCHETYPES[userIndex % ARCHETYPES.length];
  const investPct = archetype.investPctRange[0] + Math.random() * (archetype.investPctRange[1] - archetype.investPctRange[0]);
  const investAmount = startingCash * investPct;

  // Apply small random jitter to weights and normalize
  const entries = Object.entries(archetype.weights).filter(([ticker]) => seedAssets.some(a => a.ticker === ticker));
  const jittered = entries.map(([ticker, w]) => {
    const jitter = 1 + (Math.random() - 0.5) * 0.25; // +/-12.5%
    return [ticker, Math.max(0, w * jitter)] as const;
  });
  const sum = jittered.reduce((acc, [, w]) => acc + w, 0);
  let weightsMap = new Map<string, number>(jittered.map(([ticker, w]) => [ticker, (w / (sum || 1))]));

  // Helper to get type by ticker
  const getType = (ticker: string) => seedAssets.find(a => a.ticker === ticker)?.type || 'STOCK';

  // Filter to only meaningful allocations (> 0.1%)
  weightsMap = new Map(Array.from(weightsMap.entries()).filter(([, w]) => w > 0.001));

  // Ensure at least 6 stocks in portfolio
  const stocksInPortfolio = Array.from(weightsMap.entries()).filter(([t]) => getType(t) === 'STOCK');
  const minStocks = 6;
  
  if (stocksInPortfolio.length < minStocks) {
    const allStocks = seedAssets.filter(a => a.type === 'STOCK').map(a => a.ticker);
    const currentStocks = new Set(stocksInPortfolio.map(([t]) => t));
    const availableStocks = allStocks.filter(t => !currentStocks.has(t));
    
    // Add random stocks until we have at least 6
    const stocksToAdd = minStocks - stocksInPortfolio.length;
    const shuffled = availableStocks.sort(() => Math.random() - 0.5);
    const newStocks = shuffled.slice(0, stocksToAdd);
    
    // Scale down existing weights to make room
    const weightPerNewStock = 0.03; // 3% per new stock
    const totalNewWeight = weightPerNewStock * newStocks.length;
    for (const [t, w] of Array.from(weightsMap.entries())) {
      weightsMap.set(t, w * (1 - totalNewWeight));
    }
    
    // Add new stocks
    for (const ticker of newStocks) {
      weightsMap.set(ticker, weightPerNewStock);
    }
  }

  // Ensure proper asset type representation (70% stocks, 20% funds, 10% bonds)
  const ensureCategory = (requiredType: 'STOCK' | 'MUTUAL_FUND', minWeight: number, candidates: string[]) => {
    const hasType = Array.from(weightsMap.entries()).some(([t, w]) => w > 0 && getType(t) === requiredType);
    if (hasType) return;

    const candidate = candidates.find(t => seedAssets.some(a => a.ticker === t)) || Array.from(weightsMap.keys())[0];
    for (const [t, w] of Array.from(weightsMap.entries())) {
      weightsMap.set(t, w * (1 - minWeight));
    }
    weightsMap.set(candidate, (weightsMap.get(candidate) || 0) + minWeight);
  };

  ensureCategory('STOCK', 0.08, ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'JPM']);
  ensureCategory('MUTUAL_FUND', 0.05, ['SPY', 'VTI', 'QQQ', 'AGG', 'TLT']);

  // Convert to list and filter out tiny positions
  const finalWeights = Array.from(weightsMap.entries())
    .filter(([, weight]) => weight > 0.005) // Filter out positions < 0.5%
    .map(([ticker, weight]) => ({ ticker, weight }));

  return finalWeights.map(({ ticker, weight }) => ({ ticker, amount: investAmount * weight }));
}

async function createTradeActivities(
  userId: string,
  assetId: number,
  orderType: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  executedAt: Date,
  transactionId: string
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return;

  // Trade executed activity
  await prisma.userActivity.create({
    data: {
      userId,
      type: 'TRADE',
      subtype: 'MARKET_ORDER_EXECUTED',
      title: `${orderType === 'BUY' ? 'Bought' : 'Sold'} ${quantity} shares of ${asset.ticker} at $${price.toFixed(2)}`,
      description: `Market order executed for $${(quantity * price).toFixed(2)}`,
      data: {
        transactionId,
        ticker: asset.ticker,
        assetName: asset.name,
        action: orderType,
        quantity,
        price,
        total: quantity * price,
        executedAt,
      },
      importance: 2,
      relatedAssetId: assetId,
      relatedTransactionId: transactionId,
      icon: orderType === 'BUY' ? 'buy' : 'sell',
      color: orderType === 'BUY' ? 'success' : 'info',
      actionUrl: `/asset/${asset.ticker}`,
      createdAt: executedAt,
    },
  });
}

async function createPositionActivity(
  userId: string,
  holding: { id: string; portfolioId: string; assetId: number; quantity: number; averagePrice: number },
  change: 'NEW_POSITION' | 'INCREASED',
  executedAt: Date
) {
  const asset = await prisma.asset.findUnique({ where: { id: holding.assetId } });
  if (!asset) return;

  const title = change === 'NEW_POSITION'
    ? `New position: ${holding.quantity} shares of ${asset.ticker}`
    : `${asset.ticker} position increased to ${holding.quantity} shares`;
  const description = change === 'NEW_POSITION'
    ? `Average cost: $${holding.averagePrice.toFixed(2)}`
    : `Added shares (avg cost: $${holding.averagePrice.toFixed(2)})`;

  await prisma.userActivity.create({
    data: {
      userId,
      type: 'PORTFOLIO',
      subtype: 'POSITION_CHANGE',
      title,
      description,
      data: {
        holdingId: holding.id,
        portfolioId: holding.portfolioId,
        ticker: asset.ticker,
        assetName: asset.name,
        currentQuantity: holding.quantity,
        averagePrice: holding.averagePrice,
        changeType: change,
      },
      importance: 2,
      relatedAssetId: holding.assetId,
      icon: change === 'NEW_POSITION' ? 'new' : 'increase',
      color: 'success',
      actionUrl: `/asset/${asset.ticker}`,
      createdAt: executedAt,
    },
  });
}

async function createCashActivity(
  userId: string,
  portfolioId: string,
  newBalance: number,
  changeAmount: number,
  createdAt: Date
) {
  await prisma.userActivity.create({
    data: {
      userId,
      type: 'PORTFOLIO',
      subtype: 'CASH_BALANCE_CHANGE',
      title: `Cash balance ${changeAmount >= 0 ? 'increased' : 'decreased'} to $${newBalance.toLocaleString()}`,
      description: `${Math.abs(changeAmount).toFixed(2)} from trade`,
      data: {
        portfolioId,
        newBalance,
        changeAmount,
        previousBalance: newBalance - changeAmount,
      },
      importance: 1,
      icon: 'cash',
      color: 'info',
      actionUrl: '/portfolio',
      createdAt,
    },
  });
}

async function createWatchlistsForUser(
  userId: string,
  userIndex: number,
  tickerToAssetId: Record<string, number>,
  existingHoldings: string[]
): Promise<void> {
  const watchlistConfigs = [
    { name: 'Tech Watchlist', tickers: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'CRM', 'NFLX', 'TSLA', 'ADBE', 'ORCL', 'NOW', 'SNOW', 'PLTR', 'CRWD'] },
    { name: 'Value Stocks', tickers: ['JPM', 'BAC', 'WFC', 'C', 'WMT', 'TGT', 'PG', 'KO', 'JNJ', 'XOM', 'CVX', 'INTC', 'CSCO'] },
    { name: 'Growth Picks', tickers: ['AMZN', 'TSLA', 'NFLX', 'HD', 'COST', 'MA', 'V', 'UNH', 'SHOP', 'BKNG', 'LULU', 'CMG'] },
    { name: 'Dividend Plays', tickers: ['KO', 'PEP', 'PG', 'JNJ', 'ABBV', 'PFE', 'MRK', 'XOM', 'CVX', 'T', 'VZ', 'DUK'] },
    { name: 'Blue Chips', tickers: ['AAPL', 'MSFT', 'JPM', 'GS', 'JNJ', 'WMT', 'PG', 'KO', 'MCD', 'DIS'] },
    { name: 'Healthcare Focus', tickers: ['JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'TMO', 'DHR', 'ABT', 'GILD', 'BIIB'] },
    { name: 'Financial Services', tickers: ['JPM', 'BAC', 'GS', 'WFC', 'C', 'V', 'MA', 'SCHW', 'BLK'] },
    { name: 'Industrial Leaders', tickers: ['BA', 'CAT', 'GE', 'HON', 'RTX', 'LMT', 'HD', 'LOW'] },
    { name: 'Cybersecurity', tickers: ['CRWD', 'ZS', 'PLTR', 'NOW', 'CSCO'] },
    { name: 'Energy Sector', tickers: ['XOM', 'CVX', 'COP', 'EOG', 'SLB'] },
  ];

  // Create 2-3 watchlists per user
  const numWatchlists = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const shuffled = watchlistConfigs.sort(() => Math.random() - 0.5);
  const selectedConfigs = shuffled.slice(0, numWatchlists);

  for (const config of selectedConfigs) {
    // Add some variety - include holdings and some new tickers
    const holdingTickers = existingHoldings.filter(t => config.tickers.includes(t));
    const nonHoldingTickers = config.tickers.filter(t => !existingHoldings.includes(t));
    
    // Mix of 2-4 holdings + 3-6 non-holdings
    const numFromHoldings = Math.min(holdingTickers.length, 2 + Math.floor(Math.random() * 3));
    const numFromNonHoldings = 3 + Math.floor(Math.random() * 4);
    
    const selectedHoldings = holdingTickers.sort(() => Math.random() - 0.5).slice(0, numFromHoldings);
    const selectedNonHoldings = nonHoldingTickers.sort(() => Math.random() - 0.5).slice(0, numFromNonHoldings);
    const watchlistTickers = [...selectedHoldings, ...selectedNonHoldings];

    if (watchlistTickers.length === 0) continue;

    // Create watchlist
    const watchlist = await prisma.watchlist.create({
      data: {
        name: config.name,
        userId,
      },
    });

    // Add assets to watchlist
    for (const ticker of watchlistTickers) {
      const assetId = tickerToAssetId[ticker];
      if (!assetId) continue;

      const asset = seedAssets.find(a => a.ticker === ticker);
      if (!asset) continue;

      await prisma.watchlistItem.create({
        data: {
          watchlistId: watchlist.id,
          assetId,
          assetType: asset.type,
        },
      });
    }

    console.log(`  - Created watchlist "${config.name}" with ${watchlistTickers.length} assets`);
  }
}

async function main() {
  console.log('🧹 Cleaning existing demo users and data (keeping admin)...');

  // Clean slate: delete all non-admin users and their cascaded data
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.email !== 'admin@smg.com') {
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  console.log('🚀 Seeding 10 demo investors with day-1 trades...');

  const session = await ensureActiveSession();
  const day1 = getDayStart(session.startDate);
  
  // FIRST: Create all assets in the database (without prices yet)
  console.log('📦 Creating asset records...');
  const tempTickerToAssetId: Record<string, number> = {};
  for (const a of seedAssets) {
    let asset = await prisma.asset.findUnique({ where: { ticker: a.ticker } });
    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          ticker: a.ticker,
          name: a.name,
          type: a.type,
          allowFractionalShares: true,
          currencyName: 'USD',
          logoUrl: null,
        },
      });

      if (a.type === 'STOCK') {
        await prisma.stock.create({
          data: {
            id: asset.id,
            ticker: a.ticker,
            name: a.name,
            sector: a.extra?.sector || null,
            industry: a.extra?.industry || null,
          },
        });
      } else if (a.type === 'BOND') {
        await prisma.bond.create({
          data: {
            id: asset.id,
            issuer: a.name,
            couponRate: a.extra?.couponRate ?? 0,
            faceValue: a.extra?.faceValue ?? 1000,
            bondType: a.extra?.bondType ?? 'Corporate',
            paymentFrequency: 'Semi-annually',
          },
        });
      } else if (a.type === 'MUTUAL_FUND' || a.type === 'ETF') {
        await prisma.mutualFund.create({
          data: {
            id: asset.id,
            fundFamily: a.type === 'ETF' ? (a.extra?.category || 'ETF') : 'Demo',
            fundType: a.extra?.fundType ?? 'Mutual Fund',
            expenseRatio: a.extra?.expenseRatio ?? 0.0,
            nav: 100, // Placeholder
          },
        });
      }
    }
    tempTickerToAssetId[a.ticker] = asset.id;
    console.log(`  ✓ Created ${a.ticker}`);
  }

  // SECOND: Sync historical data for all assets (this populates DailyAggregate table)
  console.log('\n📈 Syncing historical market data from Yahoo Finance...');
  const histStart = new Date(session.startDate);
  const histEnd = new Date();
  for (const [ticker, assetId] of Object.entries(tempTickerToAssetId)) {
    try {
      const result = await syncAssetHistoricalData(assetId, histStart, histEnd);
      console.log(`  ✓ Synced ${ticker}: ${result.recordsUpdated} records`);
    } catch (e) {
      console.warn(`  ⚠️  Failed to sync ${ticker}:`, (e as Error).message);
    }
  }

  // THIRD: Now fetch prices from the synced historical data and create quote caches
  const tickerToAssetId = await ensureAssetsAndQuotes(session.startDate);

  const createdUsers: Array<{ email: string; id: string; portfolioId: string; invested: number; remainingCash: number }> = [];

  for (const [userIndex, usr] of demoUsers.entries()) {
    const user = await prisma.user.upsert({
      where: { email: usr.email },
      update: { name: usr.name, password: usr.password, active: true, role: 'USER' },
      create: { email: usr.email, name: usr.name, password: usr.password, active: true, role: 'USER' },
    });

    let portfolio = await prisma.portfolio.findFirst({ where: { userId: user.id, sessionId: session.id } });
    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          name: `${user.name || 'User'}'s Portfolio`,
          userId: user.id,
          sessionId: session.id,
          cash_balance: session.startingCash,
        },
      });
    } else {
      // Reset to starting cash for a clean demo state
      await prisma.portfolio.update({ where: { id: portfolio.id }, data: { cash_balance: session.startingCash } });
      // Cleanup existing holdings/transactions/activities for a deterministic demo
      await prisma.holding.deleteMany({ where: { portfolioId: portfolio.id } });
      await prisma.transaction.deleteMany({ where: { portfolioId: portfolio.id } });
      await prisma.userActivity.deleteMany({ where: { userId: user.id } });
    }

    const allocations = pickAllocationsForUser(userIndex, session.startingCash);
    let investedTotal = 0;
    let currentCash = session.startingCash;

    for (const alloc of allocations) {
      const assetId = tickerToAssetId[alloc.ticker];
      if (!assetId) continue;

      // Use Day 1 close (or most recent prior close) as execution price
      const dayStart = new Date(day1);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day1);
      dayEnd.setHours(23, 59, 59, 999);

      let price = 0;
      try {
        const hist = await getAssetHistoricalData(assetId, dayStart, dayEnd);
        // If no exact match (e.g., weekend), broaden the window by 14 days back and pick last <= dayEnd
        let histData = hist;
        if (!histData || histData.length === 0) {
          const back14 = new Date(dayStart);
          back14.setDate(back14.getDate() - 14);
          histData = await getAssetHistoricalData(assetId, back14, dayEnd);
        }
        if (histData && histData.length > 0) {
          const sorted = histData
            .map(h => ({ date: new Date(h.date as any), close: (h.close as number) ?? (h.adjustedClose as number) ?? 0 }))
            .filter(h => h.close)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
          for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].date.getTime() <= dayEnd.getTime()) { price = sorted[i].close; break; }
          }
        }
      } catch {}

      // Fallback to quote cache price if history missing (should be rare since we just fetched it)
      if (!price || price <= 0) {
        const quoteCache = await prisma.assetQuoteCache.findUnique({ where: { assetId } });
        if (quoteCache) {
          price = quoteCache.regularMarketPrice;
        } else {
          console.warn(`  ⚠️  No price available for ${alloc.ticker}, skipping this allocation`);
          continue;
        }
      }

      const shares = alloc.amount / price;
      const orderType: 'BUY' = 'BUY';

      // Create transaction backdated to day 1
      const transaction = await prisma.transaction.create({
        data: {
          portfolioId: portfolio.id,
          assetId,
          type: orderType,
          quantity: shares,
          price,
          total: shares * price,
          userId: user.id,
          assetType: seedAssets.find((s) => s.ticker === alloc.ticker)!.type,
          date: day1,
        },
      });

      investedTotal += shares * price;
      currentCash -= shares * price; // ignore fees for simplicity in seed

      // Upsert holding as of day 1
      const holding = await prisma.holding.upsert({
        where: {
          portfolioId_assetId: { portfolioId: portfolio.id, assetId },
        },
        update: {
          quantity: { increment: shares },
          averagePrice: price,
        },
        create: {
          portfolioId: portfolio.id,
          assetId,
          assetType: seedAssets.find((s) => s.ticker === alloc.ticker)!.type,
          quantity: shares,
          averagePrice: price,
          createdAt: day1,
        },
      });

      // Activities (trade executed + position change) backdated
      await createTradeActivities(user.id, assetId, 'BUY', shares, price, day1, transaction.id);
      await createPositionActivity(user.id, { id: holding.id, portfolioId: portfolio.id, assetId, quantity: holding.quantity, averagePrice: holding.averagePrice }, holding.quantity === shares ? 'NEW_POSITION' : 'INCREASED', day1);

      // Cash activity after each trade
      await createCashActivity(user.id, portfolio.id, currentCash, -shares * price, day1);
    }

    // Persist final cash balance
    await prisma.portfolio.update({ where: { id: portfolio.id }, data: { cash_balance: currentCash } });

    // Track holdings for watchlist creation
    const holdingTickers = allocations.map(a => a.ticker);
    
    // Create watchlists for this user
    console.log(`📋 Creating watchlists for ${user.name}...`);
    await createWatchlistsForUser(user.id, userIndex, tickerToAssetId, holdingTickers);

    createdUsers.push({ email: user.email, id: user.id, portfolioId: portfolio.id, invested: investedTotal, remainingCash: currentCash });
  }

  // Expire caches and refresh quotes so PnL reflects current market prices
  console.log('🔄 Expiring cache and refreshing current quotes for demo assets...');
  for (const assetId of Object.values(tickerToAssetId)) {
    try {
      await prisma.assetQuoteCache.update({ where: { assetId: Number(assetId) }, data: { expiresAt: new Date(0) } });
    } catch {}
    try { await getAssetQuoteWithCache(Number(assetId)); } catch {}
  }

  console.log('\n✅ Demo investors seeded with day-1 trades, watchlists, and market history.');
  console.log('\n📊 Portfolio Summary:');
  
  // Enhanced summary with holding counts
  const summaries = await Promise.all(createdUsers.map(async (u) => {
    const holdings = await prisma.holding.findMany({ where: { portfolioId: u.portfolioId }, include: { asset: true } });
    const stockCount = holdings.filter(h => h.asset.type === 'STOCK').length;
    const etfCount = holdings.filter(h => h.asset.type === 'ETF').length;
    const fundCount = holdings.filter(h => h.asset.type === 'MUTUAL_FUND').length;
    const watchlistCount = await prisma.watchlist.count({ where: { userId: u.id } });
    
    return {
      email: u.email,
      stocks: stockCount,
      etfs: etfCount,
      funds: fundCount,
      totalPositions: holdings.length,
      watchlists: watchlistCount,
      invested: Math.round(u.invested),
      cash: Math.round(u.remainingCash)
    };
  }));
  
  console.table(summaries);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


