import { NextResponse } from 'next/server';
import { OrderExecutionService } from '@/lib/order-execution-service';

/**
 * Test Order Processing Endpoint
 * 
 * POST /api/trade/test-process
 * 
 * Manually trigger order processing for testing purposes.
 * Only available in development environment.
 * 
 * This is a convenience endpoint for development/testing without needing
 * to set up authentication or wait for cron schedule.
 */
export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Test endpoint only available in development environment',
          hint: 'Use /api/trade/process-orders with proper authentication in production'
        },
        { status: 403 }
      );
    }

    console.log('Test order processing triggered at:', new Date().toISOString());

    // Process all pending orders
    const result = await OrderExecutionService.processAllPendingOrders();

    // Run cleanup for expired and old orders
    const cleanupResult = await OrderExecutionService.cleanupOrders();

    // Get current statistics
    const stats = await OrderExecutionService.getOrderProcessingStats();

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      environment: 'development',
      processing: {
        ordersProcessed: result.ordersProcessed,
        ordersExecuted: result.ordersExecuted,
        ordersExpired: result.ordersExpired,
        processingErrors: result.errors,
      },
      cleanup: {
        ordersCleaned: cleanupResult.cleaned,
        cleanupErrors: cleanupResult.errors,
      },
      currentStats: stats,
      message: `Processed ${result.ordersProcessed} orders (${result.ordersExecuted} executed, ${result.ordersExpired} expired) and cleaned ${cleanupResult.cleaned} old orders`
    });

  } catch (error) {
    console.error('Test order processing error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Failed to process orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for information
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    endpoint: '/api/trade/test-process',
    method: 'POST',
    description: 'Test endpoint for triggering order processing in development',
    usage: 'curl -X POST http://localhost:3000/api/trade/test-process',
    note: 'Only available in NODE_ENV=development',
  });
}
