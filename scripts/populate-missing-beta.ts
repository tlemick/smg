/**
 * Script to populate missing beta values for assets in watchlists
 * Fetches quoteSummary data from Yahoo Finance to get beta from defaultKeyStatistics
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { prisma } from '../prisma/client';
import { syncAssetProfile } from '../src/lib/yahoo-finance-service';

async function populateMissingBeta() {
  console.log('🔍 Finding assets missing beta values...\n');

  // Get all assets in watchlists
  const watchlistItems = await prisma.watchlistItem.findMany({
    include: {
      asset: {
        include: {
          profile: true
        }
      }
    }
  });

  const assetsNeedingBeta = watchlistItems
    .map(item => item.asset)
    .filter((asset, index, self) => 
      // Unique assets only
      self.findIndex(a => a.id === asset.id) === index
    )
    .filter(asset => 
      // Missing profile OR profile exists but beta is null
      !asset.profile || asset.profile.beta === null
    );

  console.log(`Found ${assetsNeedingBeta.length} assets missing beta values:`);
  assetsNeedingBeta.forEach(asset => {
    console.log(`  - ${asset.ticker} (${asset.name})`);
  });
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const asset of assetsNeedingBeta) {
    try {
      console.log(`📊 Fetching profile for ${asset.ticker}...`);
      const result = await syncAssetProfile(asset.id);
      
      if (result.success && result.profile.beta !== null) {
        console.log(`  ✅ Updated beta: ${result.profile.beta}`);
        successCount++;
      } else {
        console.log(`  ⚠️  Beta not available from Yahoo Finance`);
        failCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📈 Summary:');
  console.log(`  ✅ Successfully updated: ${successCount}`);
  console.log(`  ❌ Failed or unavailable: ${failCount}`);
  console.log(`  📊 Total processed: ${assetsNeedingBeta.length}`);
}

// Run the script
populateMissingBeta()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
