#!/usr/bin/env tsx

/**
 * Script to sync beta data for existing assets
 * This will fetch beta values from Yahoo Finance quoteSummary API for assets that don't have beta data
 */

import { PrismaClient } from '@prisma/client';
import yahooFinance from 'yahoo-finance2';

const prisma = new PrismaClient();

async function syncBetaData() {
  console.log('🔍 Finding assets without beta data...');
  
  // Find assets that don't have beta in either cache or profile
  const assetsWithoutBeta = await prisma.asset.findMany({
    where: {
      AND: [
        {
          OR: [
            { quoteCache: null },
            { quoteCache: { beta: null } }
          ]
        },
        {
          OR: [
            { profile: null },
            { profile: { beta: null } }
          ]
        }
      ]
    },
    include: {
      quoteCache: true,
      profile: true
    },
    take: 10 // Process in batches to avoid rate limits
  });

  console.log(`📊 Found ${assetsWithoutBeta.length} assets without beta data`);

  if (assetsWithoutBeta.length === 0) {
    console.log('✅ All assets already have beta data!');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const asset of assetsWithoutBeta) {
    try {
      console.log(`📈 Fetching beta for ${asset.ticker}...`);
      
      // Fetch quoteSummary with defaultKeyStatistics to get beta
      const quoteSummary = await yahooFinance.quoteSummary(asset.ticker, {
        modules: ['defaultKeyStatistics']
      });
      
      const beta = quoteSummary.defaultKeyStatistics?.beta;
      
      if (beta && typeof beta === 'number') {
        // Update both cache and profile with beta
        await prisma.$transaction([
          // Update cache if it exists
          asset.quoteCache ? prisma.assetQuoteCache.update({
            where: { assetId: asset.id },
            data: { beta }
          }) : prisma.assetQuoteCache.create({
            data: {
              assetId: asset.id,
              regularMarketPrice: 0, // Placeholder - will be updated on next quote fetch
              currency: 'USD',
              beta,
              expiresAt: new Date(0) // Expired so it gets refreshed
            }
          }),
          
          // Update or create profile
          prisma.assetProfile.upsert({
            where: { assetId: asset.id },
            update: { beta },
            create: {
              assetId: asset.id,
              beta
            }
          })
        ]);
        
        console.log(`✅ Updated beta for ${asset.ticker}: ${beta}`);
        successCount++;
      } else {
        console.log(`⚠️  No beta available for ${asset.ticker}`);
      }
      
      // Rate limiting - don't overwhelm Yahoo Finance
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`❌ Failed to fetch beta for ${asset.ticker}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Beta sync complete:`);
  console.log(`✅ Success: ${successCount} assets`);
  console.log(`❌ Errors: ${errorCount} assets`);
}

// Run the script
syncBetaData()
  .then(() => {
    console.log('🎉 Beta sync script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Beta sync script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });