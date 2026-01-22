import { NextResponse } from 'next/server';
import { OrderExecutionService } from '@/lib/order-execution-service';

/**
 * Cron Status Endpoint
 * 
 * GET /api/cron-status
 * 
 * Returns health check and statistics for the order processing system.
 * Useful for monitoring and debugging.
 * 
 * Public endpoint - no authentication required (only shows stats, no sensitive data)
 */
export async function GET() {
  try {
    // Get current order processing statistics
    const stats = await OrderExecutionService.getOrderProcessingStats();
    
    // Calculate total pending orders
    const totalPending = stats.pendingLimitOrders + stats.pendingMarketOrders;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      orderProcessing: {
        pendingOrders: totalPending,
        pendingLimitOrders: stats.pendingLimitOrders,
        pendingMarketOrders: stats.pendingMarketOrders,
        expiredOrders: stats.expiredOrders,
        totalProcessed: stats.totalProcessed,
      },
      system: {
        nodeEnv: process.env.NODE_ENV,
        hasCronConfig: !!process.env.ORDER_PROCESSING_API_KEY,
        internalCronEnabled: process.env.ENABLE_INTERNAL_CRON === 'true',
      },
      info: {
        description: 'Order processing system is operational',
        documentation: 'See /api/trade/process-orders for manual trigger (requires auth)',
        cronSchedule: 'Every 2 minutes during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)',
      }
    });
  } catch (error) {
    console.error('Error fetching cron status:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch order processing status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
