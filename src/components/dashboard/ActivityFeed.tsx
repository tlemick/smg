'use client';

import { useCallback } from 'react';
import { TransactionsFeedProps } from '@/types';
import { useTransactionsFeed } from '@/hooks/useTransactionsFeed';
import { TransactionSection } from './TransactionSection';
import { useRouter } from 'next/navigation';

export function TransactionsFeed({
  className = '',
  maxPendingItems = 5,
  maxCompletedItems = 7,
  showHeader = true,
  autoRefresh = false,
  refreshInterval = 30000,
  onShowAllClick
}: TransactionsFeedProps) {
  const router = useRouter();

  const { 
    pendingOrders,
    completedOrders, 
    loading, 
    error, 
    refresh, 
    hasTransactions,
    hasPending,
    hasCompleted,
    stats,
    lastFetch,
    getMostRecentPending,
    getMostRecentCompleted
  } = useTransactionsFeed({
    limit: Math.max(maxPendingItems || 5, maxCompletedItems || 7) + 10, // Buffer for proper sorting
    autoRefresh,
    refreshInterval
  });

  const handleShowAllClick = useCallback(() => {
    if (onShowAllClick) {
      onShowAllClick();
    } else {
      // Default navigation to trading page or portfolio transactions
      router.push('/portfolio?tab=transactions');
    }
  }, [onShowAllClick, router]);

  // Get limited orders for display
  const displayPendingOrders = getMostRecentPending(maxPendingItems);
  const displayCompletedOrders = getMostRecentCompleted(maxCompletedItems);

  return (
    <div className={`bg-white rounded-lg shadow-md h-full flex flex-col ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {hasTransactions ? (
                  <>
                    {stats.pending > 0 && (
                      <span className="mr-3">
                        {stats.pending} pending
                      </span>
                    )}
                    {stats.executed > 0 && (
                      <span>
                        {stats.executed} completed
                      </span>
                    )}
                  </>
                ) : (
                  'No transactions yet'
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <svg 
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              {lastFetch && (
                <span className="text-xs text-gray-500">
                  {new Date(lastFetch).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`${showHeader ? 'p-6' : 'p-4'} flex-1 overflow-hidden flex flex-col`}>
        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">
              <svg className="mx-auto h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load transactions</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !hasTransactions && (
          <div className="text-center py-12 flex-1 flex flex-col justify-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions yet</h3>
            <p className="text-gray-600">
              Start trading to see your orders and transactions here
            </p>
          </div>
        )}

        {/* Transactions Sections */}
        {!error && hasTransactions && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-6">
            {/* Pending Section */}
            <div className="flex-shrink-0">
              <TransactionSection
                title="Pending"
                icon="pending"
                badgeColor="yellow"
                orders={displayPendingOrders}
                maxItems={maxPendingItems}
                emptyMessage="No pending orders"
                loading={loading && !hasPending}
              />
            </div>

            {/* Completed Section */}
            <div className="flex-1 overflow-hidden">
              <TransactionSection
                title="Completed"
                icon="completed"
                badgeColor="green"
                orders={displayCompletedOrders}
                maxItems={maxCompletedItems}
                emptyMessage="No completed transactions"
                loading={loading && !hasCompleted}
              />
            </div>

            {/* Show All Button */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-200">
              <button
                onClick={handleShowAllClick}
                className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Show All Transactions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 