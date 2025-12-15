'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { TransactionsFeedProps } from '@/types';
import { useTransactionsFeed } from '@/hooks/useTransactionsFeed';
import { TransactionSection } from './TransactionSection';
import { useRouter } from 'next/navigation';
import { ClockIcon, WarningCircleIcon } from '@/components/ui';

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
  
  // Refs for measuring content height
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  
  // State for dynamic limits
  const [dynamicPendingLimit, setDynamicPendingLimit] = useState(maxPendingItems);
  const [dynamicCompletedLimit, setDynamicCompletedLimit] = useState(maxCompletedItems);

  const { 
    pendingOrders,
    completedOrders, 
    loading, 
    error, 
    hasTransactions,
    hasPending,
    hasCompleted,
    stats,
    getMostRecentPending,
    getMostRecentCompleted
  } = useTransactionsFeed({
    limit: Math.max(maxPendingItems || 5, maxCompletedItems || 7) + 10, // Buffer for proper sorting
    autoRefresh: false, // Disable auto-refresh
    refreshInterval: 0
  });

  const handleShowAllClick = useCallback(() => {
    if (onShowAllClick) {
      onShowAllClick();
    } else {
      // Default navigation to trading page or portfolio transactions
      router.push('/portfolio?tab=transactions');
    }
  }, [onShowAllClick, router]);

  // Dynamic content sizing effect
  useEffect(() => {
    const calculateItemLimits = () => {
      if (!contentRef.current || loading || (!hasPending && !hasCompleted)) return;

      const containerHeight = contentRef.current.clientHeight;
      const headerHeight = headerRef.current?.offsetHeight || 0;
      const buttonHeight = buttonRef.current?.offsetHeight || 0;
      
      // More conservative height estimates to prevent clipping
      const sectionHeaderHeight = 50; // Section header with badge (increased)
      const transactionItemHeight = 80; // Transaction item height (increased) 
      const sectionSpacing = 24; // Space between sections
      const paddingBuffer = 60; // Larger buffer for safety (increased)
      
      // Calculate available height for content (be more conservative)
      const availableHeight = containerHeight - paddingBuffer;
      
      // Reserve space for button and spacing first (guaranteed space)
      const buttonSpaceReserved = buttonHeight + 40; // Button + border + margin
      const contentSpaceAvailable = availableHeight - buttonSpaceReserved;
      
      // Calculate space needed for section headers
      let usedHeight = 0;
      if (hasPending) usedHeight += sectionHeaderHeight;
      if (hasCompleted) usedHeight += sectionHeaderHeight;
      if (hasPending && hasCompleted) usedHeight += sectionSpacing;
      
      const remainingHeight = Math.max(0, contentSpaceAvailable - usedHeight);
      
      // Calculate how many items we can fit (minimum 0)
      const maxItemsCanFit = Math.max(0, Math.floor(remainingHeight / transactionItemHeight));
      
      // Distribute items between pending and completed
      let newPendingLimit = 0;
      let newCompletedLimit = 0;
      
      if (hasPending && hasCompleted) {
        // Split available space, giving priority to pending, but ensure minimum of 1 each if space allows
        if (maxItemsCanFit >= 2) {
          const pendingCount = Math.min(pendingOrders.length, Math.max(1, Math.ceil(maxItemsCanFit * 0.4)));
          const completedCount = Math.min(completedOrders.length, Math.max(1, maxItemsCanFit - pendingCount));
          newPendingLimit = pendingCount;
          newCompletedLimit = completedCount;
        } else if (maxItemsCanFit === 1) {
          // Only space for one, prioritize pending
          newPendingLimit = pendingOrders.length > 0 ? 1 : 0;
          newCompletedLimit = pendingOrders.length === 0 && completedOrders.length > 0 ? 1 : 0;
        }
      } else if (hasPending) {
        newPendingLimit = Math.min(pendingOrders.length, maxItemsCanFit);
      } else if (hasCompleted) {
        newCompletedLimit = Math.min(completedOrders.length, maxItemsCanFit);
      }
      
      // Apply reasonable minimums and maximums
      newPendingLimit = Math.max(0, Math.min(newPendingLimit, maxPendingItems));
      newCompletedLimit = Math.max(0, Math.min(newCompletedLimit, maxCompletedItems));
      
      // Debug logging (can be removed in production)
      console.log('Height Calculation Debug:', {
        containerHeight,
        buttonHeight,
        contentSpaceAvailable,
        maxItemsCanFit,
        newPendingLimit,
        newCompletedLimit
      });
      
      setDynamicPendingLimit(newPendingLimit);
      setDynamicCompletedLimit(newCompletedLimit);
    };

    // Longer delay to ensure layout is complete and refs are populated
    const timer = setTimeout(calculateItemLimits, 300);
    
    return () => clearTimeout(timer);
  }, [
    loading, 
    hasPending, 
    hasCompleted, 
    pendingOrders.length, 
    completedOrders.length,
    maxPendingItems,
    maxCompletedItems
  ]);

  // Get limited orders for display using dynamic limits
  const displayPendingOrders = getMostRecentPending(dynamicPendingLimit);
  const displayCompletedOrders = getMostRecentCompleted(dynamicCompletedLimit);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg flex flex-col h-full ${className}`}>
      {/* Header */}
      {showHeader && (
        <div ref={headerRef} className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Transactions</h5>
            </div>


          </div>
        </div>
      )}

      {/* Content */}
      <div ref={contentRef} className={`${showHeader ? 'pl-6 pr-6 pb-6' : 'p-4'} flex-1 flex flex-col`}>
        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-2">
              <WarningCircleIcon size={48} weight="fill" className="mx-auto" />
            </div>
            <h5 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Failed to load transactions</h5>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !hasTransactions && (
          <div className="text-center py-12 flex-1 flex flex-col justify-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <ClockIcon size={48} weight="fill" className="mx-auto" />
            </div>
            <h5 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">No transactions yet</h5>
            <p className="text-gray-600 dark:text-gray-400">
              Start trading to see your orders and transactions here
            </p>
          </div>
        )}

        {/* Transactions Sections */}
        {!error && !loading && (
          <div className="flex-1 flex flex-col">
            {/* Content Area - No scroll, content limited to fit */}
            <div className="flex-1 space-y-6">
              {/* Pending Section */}
              {hasPending && displayPendingOrders.length > 0 && (
                <div className="flex-shrink-0">
                  <TransactionSection
                    title="Pending"
                    icon="pending"
                    badgeColor="yellow"
                    orders={displayPendingOrders}
                    maxItems={dynamicPendingLimit}
                    emptyMessage="No pending orders"
                    loading={loading && !hasPending}
                  />
                </div>
              )}

              {/* Completed Section */}
              {hasCompleted && displayCompletedOrders.length > 0 && (
                <div className="flex-shrink-0">
                  <TransactionSection
                    title="Completed"
                    icon="completed"
                    badgeColor="green"
                    orders={displayCompletedOrders}
                    maxItems={dynamicCompletedLimit}
                    emptyMessage="No completed transactions"
                    loading={loading && !hasCompleted}
                  />
                </div>
              )}
            </div>

            {/* Show All Button - Always at bottom */}
            <div ref={buttonRef} className="flex-shrink-0 pt-4 mt-4">
              <button
                onClick={handleShowAllClick}
                className="w-full px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border border-gray-900 dark:border-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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