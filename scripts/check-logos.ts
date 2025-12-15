#!/usr/bin/env tsx

import { prisma } from '../prisma/client';

async function checkLogos() {
  console.log('🔍 Checking logo data in database...');

  try {
    // Check current logo status
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        ticker: true,
        name: true,
        logoUrl: true
      },
      orderBy: { ticker: 'asc' },
      take: 20
    });

    console.log(`📊 Found ${assets.length} assets:`);
    console.log('='.repeat(80));
    
    assets.forEach(asset => {
      const status = asset.logoUrl ? '✅ HAS LOGO' : '❌ NO LOGO';
      console.log(`${asset.ticker.padEnd(6)} | ${asset.name.padEnd(30)} | ${status}`);
      if (asset.logoUrl) {
        console.log(`       | Logo URL: ${asset.logoUrl}`);
      }
    });

    // Summary stats
    const withLogos = assets.filter(a => a.logoUrl).length;
    const withoutLogos = assets.filter(a => !a.logoUrl).length;
    
    console.log('='.repeat(80));
    console.log(`📈 Summary: ${withLogos} with logos, ${withoutLogos} without logos`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogos();