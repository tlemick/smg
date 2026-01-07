'use client';

import { useTransactionsFeed } from '@/hooks/useTransactionsFeed';
import { TransactionSection } from './TransactionSection';
import { ClockIcon, WarningCircleIcon, Icon, CircleNotchIcon } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

// ✅ Component props defined inline (not in shared types)
interface TransactionsCardProps {
  className?: string;
  showHeader?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function TransactionsCard({
  className = '',
  showHeader = true,
  autoRefresh = false,
  refreshInterval = 30000,
}: TransactionsCardProps) {
  const { 
    pendingOrders,
    completedOrders, 
    isLoading, 
    error, 
    hasTransactions,
    hasPending,
    hasCompleted,
  } = useTransactionsFeed({
    limit: 1000, // Get all transactions
    autoRefresh,
    refreshInterval
  });

  return (
    <div className={`bg-card pt-16 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="mb-8">
          <h1 className="text-2xl font-mono text-foreground">Transactions</h1>
        </div>
      )}

      {/* Content */}
      <div>
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-12">
            <Icon icon={WarningCircleIcon} size="xl" className="mx-auto text-destructive mb-3" />
            <h5 className="text-sm font-medium text-foreground mb-1">Failed to load transactions</h5>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !hasTransactions && (
          <div className="text-center py-12">
            <Icon icon={ClockIcon} size="xl" className="mx-auto text-muted-foreground mb-3" />
            <h5 className="text-sm font-medium text-foreground mb-1">No transactions yet</h5>
            <p className="text-sm text-muted-foreground">
              Start trading to see your orders and transactions here
            </p>
          </div>
        )}

        {/* Transactions Sections */}
        {!error && !isLoading && hasTransactions && (
          <div className="space-y-6">
            {/* Pending Section */}
            {hasPending && pendingOrders.length > 0 && (
              <TransactionSection
                title="Pending"
                icon="pending"
                orders={pendingOrders}
                emptyMessage="No pending orders"
                loading={false}
              />
            )}

            {/* Completed Section */}
            {hasCompleted && completedOrders.length > 0 && (
              <TransactionSection
                title="Completed"
                icon="completed"
                orders={completedOrders}
                emptyMessage="No completed transactions"
                loading={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
