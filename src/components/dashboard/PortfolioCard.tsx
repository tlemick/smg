'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import { useUserRanking } from '@/hooks/useUserRanking';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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

  // Get display name (first name only)
  const fullName = user?.name || user?.email?.split('@')[0] || 'there';
  const firstName = fullName.split(' ')[0];

  // Combine loading states
  const loading = portfolioLoading || rankingLoading;
  const error = portfolioError || rankingError;

  // Show error state if portfolio data failed to load
  if (error && !loading) {
    return (
      <Card className="border-0 shadow-none">
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
    <div>
      <div>
        <h1 className="text-2xl font-mono text-foreground">
          Welcome back, {firstName}!
        </h1>
      </div>

      {/* Portfolio Stats Table - Each row is 36px (9 baseline units): py-2 (8+8) + text-sm line-height (20px) 
          This matches sidebar nav items for perfect horizontal alignment! */}
      <div className="inline-block">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell className="text-sm text-muted-foreground pl-0 pr-8">
                    Portfolio Value
                  </TableCell>
                  <TableCell className="font-mono text-sm px-0">
                    {loading ? (
                      <Skeleton className="h-5 w-28" />
                    ) : (
                      `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell className="text-sm text-muted-foreground pl-0 pr-8">
                    Total Return
                  </TableCell>
                  <TableCell 
                    className={`font-mono text-sm px-0 ${
                      totalUnrealizedPnLPercent >= 0 
                        ? 'text-chart-positive' 
                        : 'text-chart-negative'
                    }`}
                  >
                    {loading ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      totalUnrealizedPnLPercent >= 0 
                        ? `+${totalUnrealizedPnLPercent.toFixed(2)}%` 
                        : `${totalUnrealizedPnLPercent.toFixed(2)}%`
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell className="text-sm text-muted-foreground pl-0 pr-8">
                    Buying Power
                  </TableCell>
                  <TableCell className="font-mono text-sm px-0">
                    {loading ? (
                      <Skeleton className="h-5 w-28" />
                    ) : (
                      `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell className="text-sm text-muted-foreground pl-0 pr-8">
                    Current Rank
                  </TableCell>
                  <TableCell className="font-mono text-sm px-0">
                    {loading || !currentUserRank || !totalUsers ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      `${currentUserRank} / ${totalUsers.toLocaleString()}`
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell className="text-sm text-muted-foreground pl-0 pr-8">
                    Days Remaining
                  </TableCell>
                  <TableCell className="font-mono text-sm px-0">
                    {loading ? (
                      <Skeleton className="h-5 w-12" />
                    ) : (
                      daysRemaining
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Full Width Chart */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <PortfolioPerformanceChart />
        </CardContent>
      </Card>
    </div>
  );
}
