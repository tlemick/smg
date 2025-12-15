# Limit Order Execution System Setup

## Overview

The limit order execution system automatically monitors pending limit orders and executes them when price conditions are met. This document explains how to set up the system for production use.

## System Components

### 1. OrderExecutionService (`src/lib/order-execution-service.ts`)
- **Main Functions:**
  - `processAllPendingOrders()` - Processes all pending orders
  - `processLimitOrders()` - Executes limit orders when price targets are met
  - `processQueuedMarketOrders()` - Executes queued market orders when market opens
  - `cleanupOrders()` - Handles order expiration and cleanup
  - `getOrderProcessingStats()` - Provides system statistics

### 2. Process Orders API (`src/app/api/trade/process-orders/route.ts`)
- **Endpoint:** `POST /api/trade/process-orders`
- **Authentication:** Bearer token via `Authorization` header
- **Purpose:** Trigger order processing from external systems

### 3. Test Interface (`src/app/test-order-execution/page.tsx`)
- **URL:** `/test-order-execution`
- **Purpose:** Manual testing and monitoring of the order execution system

## Production Setup

### Environment Variables

Set the following environment variable for API security:

```bash
ORDER_PROCESSING_API_KEY=your-secure-api-key-here
```

**Important:** Use a strong, unique API key in production. The default `dev-key-12345` is only for development.

### Cron Job Setup

Set up a cron job to call the order processing endpoint every 2-5 minutes during market hours.

#### Option 1: Using curl with cron

```bash
# Edit crontab
crontab -e

# Add this line (runs every 3 minutes from 9:30 AM to 4:00 PM EST, Monday-Friday)
*/3 9-16 * * 1-5 curl -X POST -H "Authorization: Bearer your-secure-api-key-here" https://your-domain.com/api/trade/process-orders
```

#### Option 2: Using Vercel Cron (if deployed on Vercel)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/trade/process-orders",
      "schedule": "*/3 9-16 * * 1-5"
    }
  ]
}
```

#### Option 3: Using GitHub Actions

Create `.github/workflows/process-orders.yml`:

```yaml
name: Process Orders
on:
  schedule:
    # Runs every 3 minutes from 9:30 AM to 4:00 PM EST (14:30-21:00 UTC), Monday-Friday
    - cron: '*/3 14-21 * * 1-5'
  workflow_dispatch: # Allow manual triggers

jobs:
  process-orders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Order Processing
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.ORDER_PROCESSING_API_KEY }}" \
            -H "Content-Type: application/json" \
            https://your-domain.com/api/trade/process-orders
```

### Monitoring and Logging

#### 1. API Response Monitoring

The API returns comprehensive results:

```json
{
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "processing": {
    "ordersProcessed": 5,
    "ordersExecuted": 2,
    "ordersExpired": 1,
    "errorCount": 0
  },
  "cleanup": {
    "ordersCleaned": 3,
    "errorCount": 0
  },
  "currentStats": {
    "pendingLimitOrders": 12,
    "pendingMarketOrders": 2,
    "expiredOrders": 5,
    "totalProcessed": 150
  },
  "details": {
    "message": "Processed 5 orders (2 executed, 1 expired) and cleaned 3 old orders",
    "processingErrors": [],
    "cleanupErrors": []
  }
}
```

#### 2. Log Monitoring

Monitor server logs for these key events:

```
Order processing API called at: 2024-01-01T12:00:00.000Z
Found 5 pending limit orders to process
Executed limit order clx123 for AAPL at $150.25
Found 2 queued market orders to execute
Order processing complete: 2 executed, 1 expired
Order cleanup completed: 3 orders processed, 0 errors
```

#### 3. Error Handling

The system handles errors gracefully:
- **Individual order errors** don't stop processing of other orders
- **API errors** are logged with full context
- **Database errors** are caught and reported
- **Network errors** (price fetching) are handled with fallbacks

## Order Execution Logic

### Limit Orders

**Buy Limit Orders:**
- Execute when `current_price <= limit_price`
- Validate sufficient cash before execution
- Cancel if insufficient funds

**Sell Limit Orders:**
- Execute when `current_price >= limit_price`
- Validate sufficient shares before execution
- Cancel if insufficient shares

### Order Lifecycle

1. **Order Placement** → Status: `PENDING`
2. **Price Monitoring** → Continuous checking via cron
3. **Execution Conditions Met** → Status: `EXECUTED`
4. **Transaction Created** → Cash/holdings updated
5. **Activity Notification** → User notified

### Cleanup Rules

- **Expired Limit Orders:** Status changed to `EXPIRED` when past `expireAt` date
- **Old Queued Orders:** Market orders older than 7 days are cancelled
- **Very Old Limit Orders:** Orders without expiration older than 90 days are cancelled

## Testing and Validation

### 1. Manual Testing

Visit `/test-order-execution` to:
- Manually trigger order processing
- View real-time statistics
- Monitor execution results
- Check for errors

### 2. API Testing

```bash
# Check API status
curl https://your-domain.com/api/trade/process-orders

# Trigger order processing
curl -X POST \
  -H "Authorization: Bearer your-api-key" \
  https://your-domain.com/api/trade/process-orders
```

### 3. Database Verification

Check order status changes:

```sql
-- Check recent order executions
SELECT * FROM "LimitOrder" 
WHERE status = 'EXECUTED' 
ORDER BY "executedAt" DESC 
LIMIT 10;

-- Check pending orders
SELECT COUNT(*) as pending_count 
FROM "LimitOrder" 
WHERE status = 'PENDING';

-- Check expired orders
SELECT COUNT(*) as expired_count 
FROM "LimitOrder" 
WHERE status = 'EXPIRED';
```

## Performance Considerations

### 1. Cron Frequency
- **Market Hours:** Every 2-5 minutes (recommended: 3 minutes)
- **Off Hours:** Every 30 minutes (for cleanup only)
- **Weekends:** Once daily (cleanup only)

### 2. Database Optimization
- Ensure indexes exist on:
  - `LimitOrder.status`
  - `LimitOrder.expireAt`
  - `Order.status`
  - `Order.createdAt`

### 3. Rate Limiting
- Yahoo Finance API has rate limits
- Current implementation uses intelligent caching
- Monitor for 429 (rate limit) responses

## Security Considerations

1. **API Key Protection:** Never expose the API key in client-side code
2. **Rate Limiting:** Consider implementing rate limiting on the API endpoint
3. **HTTPS Only:** Always use HTTPS in production
4. **Input Validation:** All price and quantity inputs are validated
5. **Transaction Safety:** All order executions use database transactions

## Troubleshooting

### Common Issues

1. **Orders not executing:**
   - Check if cron job is running
   - Verify API key authentication
   - Check price data availability
   - Validate order conditions

2. **High error rates:**
   - Monitor Yahoo Finance API limits
   - Check database connectivity
   - Verify user cash/share balances

3. **Performance issues:**
   - Monitor cron job execution time
   - Check database query performance
   - Consider reducing processing frequency

### Debug Steps

1. Check `/test-order-execution` for manual testing
2. Review server logs for error details
3. Verify database order statuses
4. Test API endpoint manually with curl
5. Check environment variables and configuration

## Future Enhancements

1. **Real-time Processing:** WebSocket-based real-time order monitoring
2. **Advanced Order Types:** Stop-loss, trailing stops, etc.
3. **Performance Metrics:** Detailed execution timing and success rates
4. **Alert System:** Notifications for failed executions or system issues
5. **Historical Analytics:** Order execution performance tracking 