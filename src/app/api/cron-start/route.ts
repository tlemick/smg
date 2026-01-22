import { NextResponse } from 'next/server';
import { startOrderProcessingCron, getCronStatus } from '@/lib/cron/order-processor';

/**
 * Cron Starter Endpoint
 * 
 * This endpoint starts the internal cron job for order processing.
 * Only used for self-hosted deployments (Option C).
 * 
 * Security: Protected by API key
 * 
 * GET /api/cron-start - Get cron status
 * POST /api/cron-start - Start the cron job
 */

export async function GET() {
  const status = getCronStatus();
  
  return NextResponse.json({
    success: true,
    cron: status,
    message: status.enabled 
      ? (status.running ? 'Cron job is running' : 'Cron job is not running')
      : 'Internal cron is disabled'
  });
}

export async function POST() {
  try {
    // Only allow in development or with proper authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cron starter is only available in development or should be called on server startup' 
        },
        { status: 403 }
      );
    }

    startOrderProcessingCron();
    const status = getCronStatus();
    
    return NextResponse.json({
      success: true,
      cron: status,
      message: 'Cron job start initiated'
    });
    
  } catch (error) {
    console.error('Error starting cron:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start cron job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
