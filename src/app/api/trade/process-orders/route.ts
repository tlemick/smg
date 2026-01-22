import { NextRequest, NextResponse } from 'next/server';
import { OrderExecutionService } from '@/lib/order-execution-service';

/**
 * Process pending orders endpoint
 * POST /api/trade/process-orders
 * 
 * This endpoint should be called by:
 * 1. External cron services (like Vercel Cron, GitHub Actions, etc.)
 * 2. Background job schedulers
 * 3. Manual triggers for testing
 * 
 * Authentication: Uses a simple API key for security
 */
export async function POST(request: NextRequest) {
  try {
    // Support multiple authentication methods
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.ORDER_PROCESSING_API_KEY || 'dev-key-12345';
    const vercelCronSecret = request.headers.get('x-vercel-cron-signature');
    
    // Check if authorized by either method
    const isAuthorizedByKey = authHeader === `Bearer ${apiKey}`;
    const isVercelCron = !!vercelCronSecret; // Vercel auto-authenticates cron jobs
    
    // Allow in development without auth for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isAuthorizedByKey && !isVercelCron && !isDevelopment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized. This endpoint is for background order processing only.',
          hint: 'Use Authorization: Bearer <API_KEY> header or deploy with Vercel Cron'
        },
        { status: 401 }
      );
    }

    const authMethod = isVercelCron ? 'Vercel Cron' : isAuthorizedByKey ? 'API Key' : 'Development';
    console.log(`Order processing API called at: ${new Date().toISOString()} via ${authMethod}`);

    // Process all pending orders
    const result = await OrderExecutionService.processAllPendingOrders();

    // Run cleanup for expired and old orders
    const cleanupResult = await OrderExecutionService.cleanupOrders();

    // Get current statistics
    const stats = await OrderExecutionService.getOrderProcessingStats();

    // Log the results
    console.log('Order processing results:', {
      ordersProcessed: result.ordersProcessed,
      ordersExecuted: result.ordersExecuted,
      ordersExpired: result.ordersExpired,
      ordersCleaned: cleanupResult.cleaned,
      totalErrors: result.errors.length + cleanupResult.errors.length
    });

    // Return comprehensive results
    return NextResponse.json({
      success: result.success && cleanupResult.errors.length === 0,
      timestamp: new Date().toISOString(),
      processing: {
        ordersProcessed: result.ordersProcessed,
        ordersExecuted: result.ordersExecuted,
        ordersExpired: result.ordersExpired,
        errorCount: result.errors.length
      },
      cleanup: {
        ordersCleaned: cleanupResult.cleaned,
        errorCount: cleanupResult.errors.length
      },
      currentStats: stats,
      details: {
        message: `Processed ${result.ordersProcessed} orders (${result.ordersExecuted} executed, ${result.ordersExpired} expired) and cleaned ${cleanupResult.cleaned} old orders`,
        processingErrors: result.errors,
        cleanupErrors: cleanupResult.errors
      }
    });

  } catch (error) {
    console.error('Critical error in order processing API:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Critical error during order processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check and status
 */
export async function GET() {
  return NextResponse.json({
    status: 'Order Processing API Active',
    timestamp: new Date().toISOString(),
    info: {
      description: 'This endpoint processes pending limit orders and queued market orders',
      usage: 'POST with Authorization: Bearer <API_KEY>',
      frequency: 'Recommended: Every 2-5 minutes during market hours'
    }
  });
} 