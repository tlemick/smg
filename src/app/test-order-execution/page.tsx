'use client';

import { useState } from 'react';
import { MainNavigation } from '@/components/navigation';

interface ProcessingResult {
  success: boolean;
  timestamp: string;
  processing: {
    ordersProcessed: number;
    ordersExecuted: number;
    ordersExpired: number;
    errorCount: number;
  };
  cleanup: {
    ordersCleaned: number;
    errorCount: number;
  };
  currentStats: {
    pendingLimitOrders: number;
    pendingMarketOrders: number;
    expiredOrders: number;
    totalProcessed: number;
  };
  details: {
    message: string;
    processingErrors: string[];
    cleanupErrors: string[];
  };
}

export default function TestOrderExecutionPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessOrders = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/trade/process-orders', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dev-key-12345', // Using the default dev key
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ProcessingResult = await response.json();
      setLastResult(result);

    } catch (err) {
      console.error('Error processing orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const response = await fetch('/api/trade/process-orders', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status = await response.json();
      console.log('Order processing API status:', status);
      alert(`API Status: ${status.status}\nTimestamp: ${status.timestamp}`);

    } catch (err) {
      console.error('Error checking status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <MainNavigation />
      
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Order Execution System Test
            </h1>
            <p className="text-gray-600">
              Test the automatic limit order execution and order processing system
            </p>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Control Panel</h2>
            
            <div className="flex gap-4 mb-4">
              <button
                onClick={handleProcessOrders}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-lg font-medium ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Process Orders Now'}
              </button>

              <button
                onClick={handleCheckStatus}
                className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700"
              >
                Check API Status
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Process Orders:</strong> Manually trigger order processing (limit orders, queued market orders, cleanup)</p>
              <p><strong>Check Status:</strong> Verify the order processing API is active</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results Display */}
          {lastResult && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">Last Execution Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Processing Results */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Order Processing</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Orders Processed:</span> {lastResult.processing.ordersProcessed}</p>
                    <p><span className="font-medium">Orders Executed:</span> {lastResult.processing.ordersExecuted}</p>
                    <p><span className="font-medium">Orders Expired:</span> {lastResult.processing.ordersExpired}</p>
                    <p><span className="font-medium">Processing Errors:</span> {lastResult.processing.errorCount}</p>
                  </div>
                </div>

                {/* Cleanup Results */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Order Cleanup</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Orders Cleaned:</span> {lastResult.cleanup.ordersCleaned}</p>
                    <p><span className="font-medium">Cleanup Errors:</span> {lastResult.cleanup.errorCount}</p>
                  </div>
                </div>
              </div>

              {/* Current Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Current System Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Pending Limit Orders</p>
                    <p className="text-2xl font-bold text-orange-600">{lastResult.currentStats.pendingLimitOrders}</p>
                  </div>
                  <div>
                    <p className="font-medium">Pending Market Orders</p>
                    <p className="text-2xl font-bold text-blue-600">{lastResult.currentStats.pendingMarketOrders}</p>
                  </div>
                  <div>
                    <p className="font-medium">Expired Orders</p>
                    <p className="text-2xl font-bold text-red-600">{lastResult.currentStats.expiredOrders}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Processed</p>
                    <p className="text-2xl font-bold text-green-600">{lastResult.currentStats.totalProcessed}</p>
                  </div>
                </div>
              </div>

              {/* Execution Summary */}
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Execution Summary</h3>
                <p className="text-sm">{lastResult.details.message}</p>
                <p className="text-xs text-gray-500 mt-2">Executed at: {lastResult.timestamp}</p>
              </div>

              {/* Errors */}
              {(lastResult.details.processingErrors.length > 0 || lastResult.details.cleanupErrors.length > 0) && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Errors</h3>
                  
                  {lastResult.details.processingErrors.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium text-sm">Processing Errors:</p>
                      <ul className="list-disc list-inside text-xs text-red-700">
                        {lastResult.details.processingErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lastResult.details.cleanupErrors.length > 0 && (
                    <div>
                      <p className="font-medium text-sm">Cleanup Errors:</p>
                      <ul className="list-disc list-inside text-xs text-red-700">
                        {lastResult.details.cleanupErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-lg">Limit Order Execution</h3>
                <p className="text-sm">
                  The system continuously monitors pending limit orders and executes them when price conditions are met:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 ml-4">
                  <li>Buy limit orders execute when current price ≤ limit price</li>
                  <li>Sell limit orders execute when current price ≥ limit price</li>
                  <li>Orders are validated for sufficient cash/shares before execution</li>
                  <li>Failed orders are automatically cancelled with clear reasons</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg">Order Cleanup</h3>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>Limit orders expire automatically based on their expiration date</li>
                  <li>Queued market orders older than 7 days are cancelled</li>
                  <li>Limit orders without expiration older than 90 days are cancelled</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg">Production Setup</h3>
                <p className="text-sm">
                  In production, set up a cron job to call <code className="bg-gray-100 px-1 rounded">/api/trade/process-orders</code> every 2-5 minutes during market hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 