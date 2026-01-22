import cron from 'node-cron';

/**
 * Background Order Processing Cron
 * 
 * This service runs a cron job to process pending orders every 2 minutes
 * during market hours (9:30 AM - 4:00 PM ET, Monday-Friday).
 * 
 * Usage: Only for self-hosted deployments (Option C)
 * - Set ENABLE_INTERNAL_CRON=true in environment variables
 * - Call startOrderProcessingCron() on server startup
 * 
 * For Vercel or GitHub Actions, use those platforms instead.
 */

let cronJob: cron.ScheduledTask | null = null;

export function startOrderProcessingCron() {
  // Check if cron is enabled
  const enableCron = process.env.ENABLE_INTERNAL_CRON === 'true';
  
  if (!enableCron) {
    console.log('Internal cron disabled. Set ENABLE_INTERNAL_CRON=true to enable.');
    return;
  }

  // Prevent multiple cron jobs
  if (cronJob) {
    console.log('Order processing cron already running');
    return;
  }

  console.log('Starting order processing cron job...');

  // Every 2 minutes during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
  // Note: node-cron runs in server's local time, ensure server is set to ET
  // or adjust schedule accordingly
  cronJob = cron.schedule('*/2 9-16 * * 1-5', async () => {
    console.log('Running order processing cron...', new Date().toISOString());
    
    try {
      const apiKey = process.env.ORDER_PROCESSING_API_KEY;
      
      if (!apiKey) {
        console.error('ORDER_PROCESSING_API_KEY not set!');
        return;
      }

      // Determine the base URL (use localhost in development, actual URL in production)
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/trade/process-orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Order processing successful:', {
          ordersProcessed: result.processing.ordersProcessed,
          ordersExecuted: result.processing.ordersExecuted,
          ordersExpired: result.processing.ordersExpired,
        });
      } else {
        console.error('Order processing failed:', result);
      }
    } catch (error) {
      console.error('Order processing cron error:', error);
    }
  }, {
    timezone: "America/New_York" // Eastern Time
  });

  console.log('Order processing cron job started successfully');
}

export function stopOrderProcessingCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('Order processing cron job stopped');
  }
}

export function getCronStatus() {
  return {
    running: cronJob !== null,
    enabled: process.env.ENABLE_INTERNAL_CRON === 'true',
  };
}
