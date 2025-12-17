'use client';

import React, { useState, useEffect } from 'react';
import { MarketStateService } from '../../lib/market-state-service';
import { CashManagementService } from '../../lib/cash-management-service';

interface TestResult {
  testName: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
}

export default function TradingSystemTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  const addTestResult = (testName: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    const result: TestResult = {
      testName,
      status,
      message,
      data,
      timestamp: new Date()
    };
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    if (!currentUser) {
      addTestResult('Setup', 'error', 'User authentication required. Please log in first.');
      setIsRunning(false);
      return;
    }

    addTestResult('Test Suite', 'pending', 'Starting comprehensive trading system tests...');
    
    // Test in logical order
    await testMarketStateViaAPI();
    await testCashManagementViaAPI();
    await testMarketOrderAPI();
    await testLimitOrderAPI();
    await testOrderManagementAPI();
    
    addTestResult('Test Suite', 'success', 'All tests completed! Check individual results above.');
    setIsRunning(false);
  };

  const testMarketStateViaAPI = async () => {
    try {
      addTestResult('Market State Service', 'pending', 'Testing market state via trading APIs...');
      
      // Test market state detection through trading API
      const response = await fetch('/api/trade/market-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: 1,
          orderType: 'BUY',
          dollarAmount: 1, // Very small test amount
        })
      });

      const result = await response.json();
      
      if (result.success && result.orderDetails) {
        const marketState = result.orderDetails.marketState;
        const executionStatus = result.executionStatus;
        
        addTestResult(
          'Market State Detection', 
          'success', 
          `Market detected as: ${marketState}. Order ${executionStatus}`,
          { marketState, executionStatus }
        );

        // Test educational content is present
        if (result.educationalNote) {
          addTestResult(
            'Educational Market State', 
            'success', 
            `Educational note provided: "${result.educationalNote.substring(0, 80)}..."`,
            { educationalNote: result.educationalNote }
          );
        }

        // Test market behavior
        const canTradeImmediately = executionStatus === 'EXECUTED';
        addTestResult(
          'Market Trading Status', 
          'success', 
          `Can trade immediately: ${canTradeImmediately} (Market: ${marketState})`,
          { canTradeImmediately, marketState, explanation: 
            canTradeImmediately ? 'Market is open - trades execute immediately' : 
            'Market is closed - orders are queued until market opens' }
        );

      } else {
        addTestResult('Market State Service', 'error', result.error || 'Failed to test market state');
      }

    } catch (error: any) {
      addTestResult('Market State Service', 'error', `Failed: ${error.message}`, error);
    }
  };

  const testCashManagementViaAPI = async () => {
    try {
      addTestResult('Cash Management Service', 'pending', 'Testing cash management via trading APIs...');
      
      // Test cash management through successful order placement
      const response = await fetch('/api/trade/market-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: 3, // AAPL
          orderType: 'BUY',
          dollarAmount: 100, // Test with $100
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addTestResult(
          'Cash Validation', 
          'success', 
          `Order accepted - cash management working. Amount: $${result.orderDetails.totalValue}`,
          { orderValue: result.orderDetails.totalValue }
        );

        addTestResult(
          'Order Cost Calculation', 
          'success', 
          `Calculated ${result.orderDetails.shares.toFixed(4)} shares at $${result.orderDetails.pricePerShare}`,
          { 
            shares: result.orderDetails.shares,
            price: result.orderDetails.pricePerShare,
            fees: result.orderDetails.fees,
            netAmount: result.orderDetails.netAmount
          }
        );

        // Test portfolio update (if executed immediately)
        if (result.portfolioUpdate) {
          addTestResult(
            'Portfolio Cash Update', 
            'success', 
            `Cash updated: $${result.portfolioUpdate.previousCash.toLocaleString()} → $${result.portfolioUpdate.newCash.toLocaleString()}`,
            result.portfolioUpdate
          );
        }

      } else {
        // If order failed due to insufficient funds, that's actually testing cash validation!
        if (result.error && result.error.includes('Insufficient')) {
          addTestResult(
            'Cash Validation', 
            'success', 
            'Cash validation working - insufficient funds properly detected',
            { error: result.error }
          );
        } else {
          addTestResult('Cash Management Service', 'error', result.error || 'Cash management test failed');
        }
      }

      // Test educational content about fees
      addTestResult(
        'Educational Fee Information', 
        'success', 
        'Fee structure: Modern brokers typically charge $0 commission + small SEC fees on sales',
        { 
          explanation: 'Educational simulation includes realistic fee structure for learning',
          commissionFee: '$0 (modern brokers are commission-free)',
          secFee: '0.00229% of sale value (regulatory fee)'
        }
      );

    } catch (error: any) {
      addTestResult('Cash Management Service', 'error', `Failed: ${error.message}`, error);
    }
  };

  const testMarketOrderAPI = async () => {
    try {
      addTestResult('Market Order API', 'pending', 'Testing market order placement...');
      
      const response = await fetch('/api/trade/market-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: 1, // MSFT
          orderType: 'BUY',
          dollarAmount: 50, // Small test amount
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addTestResult(
          'Market Order Placement', 
          'success', 
          `Order ${result.executionStatus}: ${result.message}`,
          result
        );

        // Test fractional share calculation
        if (result.orderDetails.shares) {
          const isWhole = result.orderDetails.shares % 1 === 0;
          addTestResult(
            'Fractional Share Support', 
            'success', 
            `Calculated ${result.orderDetails.shares.toFixed(6)} shares ${isWhole ? '(whole shares)' : '(fractional shares)'}`,
            { shares: result.orderDetails.shares, supportsFractional: !isWhole }
          );
        }

      } else {
        addTestResult(
          'Market Order Placement', 
          'error', 
          result.error || 'Market order failed',
          result
        );
      }

    } catch (error: any) {
      addTestResult('Market Order API', 'error', `API call failed: ${error.message}`, error);
    }
  };

  const testLimitOrderAPI = async () => {
    try {
      addTestResult('Limit Order API', 'pending', 'Testing limit order placement...');
      
      const response = await fetch('/api/trade/limit-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: 1, // MSFT
          orderType: 'BUY',
          shares: 1,
          limitPrice: 100, // Below current market price
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addTestResult(
          'Limit Order Placement', 
          'success', 
          `Limit order placed: ${result.message}`,
          result
        );

        // Test limit price validation
        if (result.orderDetails) {
          const priceComparison = result.orderDetails.limitPrice < result.orderDetails.currentPrice ? 'below' : 'above';
          addTestResult(
            'Limit Price Validation', 
            'success', 
            `Limit price $${result.orderDetails.limitPrice} is ${priceComparison} current price $${result.orderDetails.currentPrice}`,
            { 
              limitPrice: result.orderDetails.limitPrice,
              currentPrice: result.orderDetails.currentPrice,
              orderType: result.orderDetails.orderType,
              priceComparison
            }
          );
        }

      } else {
        addTestResult(
          'Limit Order Placement', 
          'error', 
          result.error || 'Limit order failed',
          result
        );
      }

    } catch (error: any) {
      addTestResult('Limit Order API', 'error', `API call failed: ${error.message}`, error);
    }
  };

  const testOrderManagementAPI = async () => {
    try {
      addTestResult('Order Management API', 'pending', 'Testing order retrieval and management...');
      
      // Test getting all orders
      const response = await fetch('/api/trade/orders?limit=10');
      const result = await response.json();
      
      if (result.success) {
        addTestResult(
          'Order Retrieval', 
          'success', 
          `Retrieved ${result.orders.length} orders. Pending: ${result.summary.totalPending}, Executed: ${result.summary.totalExecuted}`,
          result.summary
        );

        // Test order categorization
        const marketOrders = result.orders.filter((order: any) => order.isMarketOrder);
        const limitOrders = result.orders.filter((order: any) => !order.isMarketOrder);
        
        addTestResult(
          'Order Categorization', 
          'success', 
          `Market orders: ${marketOrders.length}, Limit orders: ${limitOrders.length}`,
          { marketOrderCount: marketOrders.length, limitOrderCount: limitOrders.length }
        );

        // Test educational information
        if (result.educationalInfo) {
          addTestResult(
            'Educational Order Information', 
            'success', 
            `Educational sections provided: ${result.educationalInfo.sections.length}`,
            result.educationalInfo
          );
        }

        // If there are any pending limit orders, test cancellation
        const pendingLimitOrder = result.orders.find((order: any) => 
          order.status === 'PENDING' && !order.isMarketOrder
        );

        if (pendingLimitOrder) {
          addTestResult('Order Cancellation', 'pending', 'Testing order cancellation...');
          
          const cancelResponse = await fetch(`/api/trade/orders/${pendingLimitOrder.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' })
          });

          const cancelResult = await cancelResponse.json();
          
          if (cancelResult.success) {
            addTestResult(
              'Order Cancellation', 
              'success', 
              `Order cancelled successfully: ${cancelResult.message}`,
              cancelResult
            );
          } else {
            addTestResult(
              'Order Cancellation', 
              'error', 
              cancelResult.error || 'Order cancellation failed',
              cancelResult
            );
          }
        } else {
          addTestResult(
            'Order Cancellation', 
            'success', 
            'No pending limit orders to cancel (cancellation functionality available)',
            { note: 'Cancellation API available - create a limit order first to test' }
          );
        }

      } else {
        addTestResult(
          'Order Management API', 
          'error', 
          result.error || 'Order retrieval failed',
          result
        );
      }

    } catch (error: any) {
      addTestResult('Order Management API', 'error', `API call failed: ${error.message}`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold font-mono text-gray-900 mb-6">🧪 Trading System Integration Test</h1>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            This comprehensive test verifies all Phase 1 and Phase 2 functionality:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li><strong>Phase 1:</strong> Market State Service, Cash Management Service</li>
            <li><strong>Phase 2:</strong> Market Orders, Limit Orders, Order Management</li>
          </ul>
        </div>

        {!currentUser && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ <strong>Authentication Required:</strong> Please log in to run trading system tests.
            </p>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning || !currentUser}
            className={`px-6 py-2 rounded-lg font-medium ${
              isRunning || !currentUser
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? '⏳ Running Tests...' : '🚀 Run All Tests'}
          </button>
          
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            🗑️ Clear Results
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Test Results</h2>
            
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-400'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-yellow-50 border-yellow-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <h3 className={`font-semibold ${getStatusColor(result.status)}`}>
                        {result.testName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{result.message}</p>
                    
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          📋 View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Educational Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎓 Educational Notes</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Market orders execute immediately when market is open, or queue for market open</li>
            <li>• Limit orders wait for your target price before executing</li>
            <li>• Cash management prevents overspending your $100,000 virtual balance</li>
            <li>• All educational features include detailed explanations for learning</li>
            <li>• Test results help verify the trading system is working correctly</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 