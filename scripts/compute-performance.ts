/**
 * Manual Performance Computation Script
 * 
 * Run this to pre-compute performance data for all active sessions.
 * Usage: npx tsx scripts/compute-performance.ts
 */

import { computeAllActiveSessionsPerformance } from '../src/lib/performance-computation-service';

async function main() {
  console.log('Starting performance computation...\n');
  const startTime = Date.now();

  try {
    await computeAllActiveSessionsPerformance();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Performance computation completed successfully in ${duration}s`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Performance computation failed:', error);
    process.exit(1);
  }
}

main();
