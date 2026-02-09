'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface PortfolioStatsBadgesProps {
  formattedCashBalance: string;
  currentUserRank: number | null;
  totalUsers: number | null;
  daysRemaining: number;
  isLoading: boolean;
}

export function PortfolioStatsBadges({
  formattedCashBalance,
  currentUserRank,
  totalUsers,
  daysRemaining,
  isLoading,
}: PortfolioStatsBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Buying Power */}
      <Badge variant="default">
        <span className="text-muted mr-2">Buying Power</span>
        {isLoading ? (
          <Skeleton className="h-4 w-24 inline-block text-background" />
        ) : (
          <span className="text-background">{formattedCashBalance}</span>
        )}
      </Badge>

      {/* Current Rank */}
      <Badge variant="default">
        <span className="text-muted mr-2">Current Rank</span>
        {isLoading || !currentUserRank || !totalUsers ? (
          <Skeleton className="h-4 w-16 inline-block text-background" />
        ) : (
          <span className="text-background">{`${currentUserRank} / ${totalUsers.toLocaleString()}`}</span>
        )}
      </Badge>

      {/* Days Remaining */}
      <Badge variant="default">
        <span className="text-muted mr-2">Days Remaining</span>
        {isLoading ? (
          <Skeleton className="h-4 w-8 inline-block text-background" />
        ) : (
          <span className="text-background">{daysRemaining}</span>
        )}
      </Badge>
    </div>
  );
}
