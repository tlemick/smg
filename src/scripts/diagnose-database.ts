/**
 * Database Diagnostic Script
 * 
 * Checks what's actually in your production database
 * Run with: npx tsx src/scripts/diagnose-database.ts
 */

import { prisma } from '@/prisma/client';

async function diagnoseDatabaseState() {
  console.log('\n=== Database Diagnostic ===\n');

  try {
    // 1. Check Assets
    console.log('1. Checking Assets...');
    const assetCount = await prisma.asset.count();
    console.log(`   Total assets: ${assetCount}`);
    
    const sampleAssets = await prisma.asset.findMany({
      take: 5,
      select: { ticker: true, name: true, type: true },
    });
    console.log('   Sample assets:', sampleAssets);

    // 2. Check Historical Data
    console.log('\n2. Checking AssetHistoricalData...');
    const historicalCount = await prisma.assetHistoricalData.count();
    console.log(`   Total historical data points: ${historicalCount}`);
    
    if (historicalCount > 0) {
      const sampleHistorical = await prisma.assetHistoricalData.findMany({
        take: 3,
        include: { asset: { select: { ticker: true } } },
        orderBy: { date: 'desc' },
      });
      console.log('   Sample historical data:');
      sampleHistorical.forEach(h => {
        console.log(`     ${h.asset.ticker} on ${h.date}: close=${h.close}`);
      });
    } else {
      console.log('   ⚠️ NO HISTORICAL DATA FOUND!');
    }

    // 3. Check Holdings (to see what tickers we need data for)
    console.log('\n3. Checking Holdings...');
    const holdingsCount = await prisma.holding.count();
    console.log(`   Total holdings: ${holdingsCount}`);
    
    if (holdingsCount > 0) {
      const holdings = await prisma.holding.findMany({
        take: 10,
        include: { 
          asset: { select: { ticker: true } },
          portfolio: { select: { userId: true } }
        },
      });
      console.log('   Holdings tickers:', holdings.map(h => h.asset.ticker));
      
      // Check if these tickers have historical data
      console.log('\n4. Checking Historical Data for Current Holdings...');
      for (const holding of holdings) {
        const historicalForAsset = await prisma.assetHistoricalData.count({
          where: { assetId: holding.assetId },
        });
        console.log(`   ${holding.asset.ticker}: ${historicalForAsset} data points`);
      }
    } else {
      console.log('   ⚠️ NO HOLDINGS FOUND!');
    }

    // 5. Check Portfolios
    console.log('\n5. Checking Portfolios...');
    const portfolioCount = await prisma.portfolio.count();
    console.log(`   Total portfolios: ${portfolioCount}`);

    // 6. Check Users
    console.log('\n6. Checking Users...');
    const userCount = await prisma.user.count();
    console.log(`   Total users: ${userCount}`);

    console.log('\n=== Summary ===');
    if (assetCount === 0) {
      console.log('❌ No assets in database - run: npm run db:seed');
    } else if (historicalCount === 0) {
      console.log('❌ Assets exist but NO historical data - need to sync from Yahoo Finance');
      console.log('   The /api/chart/batch endpoint should sync automatically, but might be failing');
    } else if (holdingsCount === 0) {
      console.log('⚠️  Data exists but no user holdings - sparklines won\'t show');
    } else {
      console.log('✓ Database has data - issue might be in the API/frontend logic');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDatabaseState();
