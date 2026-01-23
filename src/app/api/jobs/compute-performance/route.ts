/**
 * Background Job: Compute Performance
 * 
 * This endpoint should be called by a cron job (Vercel Cron, GitHub Actions, etc.)
 * to pre-compute performance data for all active sessions.
 * 
 * Security: Requires API key in Authorization header
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/jobs/compute-performance",
 *     "schedule": "0 18 * * *"  // Every day at 6 PM EST (after market close)
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeAllActiveSessionsPerformance } from '@/lib/performance-computation-service';

const AUTHORIZED_API_KEY = process.env.CRON_API_KEY || process.env.ORDER_PROCESSING_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    // For Vercel Cron, the header is automatically added with CRON_SECRET
    const cronSecret = request.headers.get('x-vercel-cron-secret');
    const expectedCronSecret = process.env.CRON_SECRET;

    const isAuthorized =
      (apiKey && apiKey === AUTHORIZED_API_KEY) ||
      (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled performance computation...');
    const startTime = Date.now();

    await computeAllActiveSessionsPerformance();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Performance computation completed in ${duration}s`);

    return NextResponse.json({
      success: true,
      message: `Performance computation completed successfully`,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Performance computation job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Performance computation failed',
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual triggering via browser (with auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
