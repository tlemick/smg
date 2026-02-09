'use client';

import { useUser } from '@/hooks/useUser';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import { useUserRanking } from '@/hooks/useUserRanking';
import { Card, CardContent } from '@/components/ui/card';
import { Icon, WarningCircleIcon } from '@/components/ui';
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';
import { PortfolioHighlightsCard } from './PortfolioHighlightsCard';
import { PortfolioStatsBadges } from './PortfolioStatsBadges';

export function PortfolioCard() {
  const { user } = useUser();
  const { 
    formattedTotalPortfolioValue,
    formattedTotalUnrealizedPnLPercent,
    totalUnrealizedPnLColorClass,
    formattedCashBalance,
    data,
    isLoading: portfolioLoading,
    error: portfolioError 
  } = usePortfolioOverview();
  
  const {
    currentUserRank,
    totalUsers,
    isLoading: rankingLoading,
    error: rankingError
  } = useUserRanking();

  // Calculate days remaining until game session ends using real end date
  const gameSessionEndDate = data?.data?.portfolioBreakdown?.[0]?.gameSession?.endDate;
  const gameEndDate = gameSessionEndDate ? new Date(gameSessionEndDate) : new Date('2024-12-31'); // fallback
  const today = new Date();
  const timeDiff = gameEndDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  // Get display name (first name only)
  const fullName = user?.name || user?.email?.split('@')[0] || 'there';
  const firstName = fullName.split(' ')[0];

  // Combine loading states
  const loading = portfolioLoading || rankingLoading;
  const error = portfolioError || rankingError;

  // Show error state if portfolio data failed to load
  if (error && !loading) {
    return (
      <Card className="border-border shadow-none">
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Icon icon={WarningCircleIcon} size="md" className="text-destructive" />
              <div>
                <h4 className="text-sm font-medium text-foreground">Unable to load portfolio data</h4>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message and stats badges in horizontal layout */}
      <div className="flex flex-col items-start flex-wrap">
        <h1 className="text-2xl text-foreground whitespace-nowrap">
          Welcome back, {firstName}!
        </h1>
        <PortfolioStatsBadges
          formattedCashBalance={formattedCashBalance}
          currentUserRank={currentUserRank}
          totalUsers={totalUsers}
          daysRemaining={daysRemaining}
          isLoading={loading}
        />
      </div>

      {/* Performance Chart and Portfolio Highlights side by side */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
        {/* Left: Performance Chart - takes 2/3 width on desktop */}
        <div className="lg:w-2/3">
          <Card className="border-0 shadow-none h-full flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <PortfolioPerformanceChart
                portfolioValue={formattedTotalPortfolioValue}
                totalReturn={formattedTotalUnrealizedPnLPercent}
                totalReturnColorClass={totalUnrealizedPnLColorClass}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right: Portfolio Highlights - takes 1/3 width on desktop */}
        <div className="lg:w-1/3">
          <PortfolioHighlightsCard />
        </div>
      </div>
    </div>
  );
}
