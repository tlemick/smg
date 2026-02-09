/**
 * Test script for sparkline data fetching
 * 
 * Run with: npx tsx src/scripts/test-sparklines.ts
 * (requires tsx: npm install -D tsx)
 */

async function testSparklineAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  console.log('\n=== Testing Sparkline API ===\n');

  // Test 1: Check if /api/chart/batch endpoint exists
  console.log('Test 1: Checking endpoint...');
  try {
    const testRequest = {
      requests: [
        {
          ticker: 'AAPL',
          period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          period2: new Date().toISOString(),
        },
      ],
    };

    console.log('Sending request:', JSON.stringify(testRequest, null, 2));

    const response = await fetch(`${baseUrl}/api/chart/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (data.success && data.results && data.results.length > 0) {
      const result = data.results[0];
      if (result.success && result.data) {
        console.log(`✓ Success! Got ${result.data.length} data points for ${result.ticker}`);
        console.log('First 5 prices:', result.data.slice(0, 5));
      } else {
        console.log('✗ Result failed:', result.error);
      }
    } else {
      console.log('✗ Batch request failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
  }

  // Test 2: Check database for assets
  console.log('\n\nTest 2: Checking database for assets...');
  console.log('(This requires Prisma Client to be available)');
  
  try {
    const { prisma } = await import('../../prisma/client');
    const assets = await prisma.asset.findMany({
      take: 5,
      select: { ticker: true, name: true, type: true },
    });
    console.log('Sample assets in database:', assets);
    
    const historicalCount = await prisma.assetHistoricalData.count();
    console.log(`Total historical data points: ${historicalCount}`);
    
    if (assets.length > 0) {
      const sampleTicker = assets[0].ticker;
      const historicalForSample = await prisma.assetHistoricalData.findMany({
        where: { assetId: assets[0].id },
        take: 5,
        orderBy: { date: 'desc' },
        select: { date: true, close: true },
      });
      console.log(`Sample historical data for ${sampleTicker}:`, historicalForSample);
    }
  } catch (error) {
    console.error('✗ Database check failed:', error);
  }
}

testSparklineAPI().catch(console.error);
