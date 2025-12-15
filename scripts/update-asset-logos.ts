#!/usr/bin/env tsx

/**
 * Script to update existing assets with company logos
 */

import { prisma } from '../prisma/client';
import { getCompanyLogoUrl } from '../src/lib/logo-service';

async function updateAssetLogos() {
  console.log('🚀 Starting logo update for existing assets...');

  try {
    // Get all assets that don't have logos
    const assetsWithoutLogos = await prisma.asset.findMany({
      where: {
        logoUrl: null,
        active: true
      },
      select: {
        id: true,
        ticker: true,
        name: true
      }
    });

    console.log(`📦 Found ${assetsWithoutLogos.length} assets without logos`);

    let updated = 0;
    let failed = 0;

    for (const asset of assetsWithoutLogos) {
      try {
        console.log(`🔍 Processing ${asset.ticker}...`);
        
        const logoUrl = await getCompanyLogoUrl(asset.ticker, asset.name);
        
        if (logoUrl) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: { logoUrl }
          });
          
          console.log(`✅ Updated ${asset.ticker} with logo: ${logoUrl}`);
          updated++;
        } else {
          console.log(`⚠️  No logo found for ${asset.ticker}`);
        }
        
        // Small delay to be nice to external services
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to update ${asset.ticker}:`, error);
        failed++;
      }
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Updated: ${updated} assets`);
    console.log(`❌ Failed: ${failed} assets`);
    console.log(`⚠️  No logos: ${assetsWithoutLogos.length - updated - failed} assets`);

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateAssetLogos().catch(console.error);