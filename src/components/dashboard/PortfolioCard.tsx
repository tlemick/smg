'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import { useUserRanking } from '@/hooks/useUserRanking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CaretRightIcon, Icon, WarningCircleIcon } from '@/components/ui';
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';

export function PortfolioCard() {
  const { user } = useUser();
  const { 
    cashBalance, 
    totalPortfolioValue, 
    totalUnrealizedPnLPercent, 
    data,
    loading: portfolioLoading,
    error: portfolioError 
  } = usePortfolioOverview();
  
  const {
    currentUserRank,
    totalUsers,
    loading: rankingLoading,
    error: rankingError
  } = useUserRanking();

  // Calculate days remaining until game session ends using real end date
  const gameSessionEndDate = data?.data?.portfolioBreakdown?.[0]?.gameSession?.endDate;
  const gameEndDate = gameSessionEndDate ? new Date(gameSessionEndDate) : new Date('2024-12-31'); // fallback
  const today = new Date();
  const timeDiff = gameEndDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  // Get display name
  const displayName = user?.name || user?.email?.split('@')[0] || 'Your';

  // Combine loading states
  const loading = portfolioLoading || rankingLoading;
  const error = portfolioError || rankingError;

  // Show error state if portfolio data failed to load
  if (error && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{displayName}'s Portfolio</CardTitle>
        </CardHeader>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{displayName}'s Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buying Power - Keep yellow accent */}
          <div className="bg-[#FEF100] rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-1">Buying Power</p>
            <h2 className="text-2xl font-bold text-foreground font-mono">
              {loading ? '$---.--' : `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h2>
          </div>

          {/* Days Remaining */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Days Remaining</p>
            <h2 className="text-2xl font-bold text-foreground font-mono">
              {loading ? '--' : daysRemaining}
            </h2>
          </div>

          {/* Current Rank */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Rank</p>
            <h2 className="text-2xl font-bold text-foreground font-mono">
              {loading ? '--' : currentUserRank} <span className="text-lg text-muted-foreground">of</span> {loading ? '--' : totalUsers.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Portfolio Performance Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8 min-h-[400px]">
          {/* Left Column - Portfolio Actions & Metrics */}
          <div className="flex flex-col justify-end space-y-4 lg:space-y-2">
            {/* View Full Portfolio Button */}
            <Button
              variant="outline"
              asChild
              className="self-start rounded-full"
            >
              <Link href="/portfolio" className="flex items-center gap-2">
                <span>View Full Portfolio</span>
                <Icon icon={CaretRightIcon} size="sm" />
              </Link>
            </Button>

            {/* Portfolio Performance Since Start */}
            <div>
              <h2 className="text-3xl font-bold text-foreground font-mono">
                {loading ? '--.--%' : 
                  totalUnrealizedPnLPercent >= 0 
                    ? `+${totalUnrealizedPnLPercent.toFixed(2)}%` 
                    : `${totalUnrealizedPnLPercent.toFixed(2)}%`
                }
              </h2>
              <p className="text-sm text-muted-foreground">Total Return</p>
            </div>

            {/* Current Portfolio Balance */}
            <div>
              <h2 className="text-3xl font-bold text-foreground font-mono">
                {loading ? '$---.--' : `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </h2>
              <p className="text-sm text-muted-foreground">Current Portfolio Value</p>
            </div>
          </div>
          
          {/* Right Column - Performance Chart */}
          <div className="flex-1 min-w-0 w-full lg:w-auto flex justify-end items-end">
            <div className="w-full">
              <PortfolioPerformanceChart />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
