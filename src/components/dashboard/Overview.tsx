'use client';

import { useUser } from '@/hooks/useUser';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import { useUserRanking } from '@/hooks/useUserRanking';
import { CaretRightIcon, Icon, WarningCircleIcon } from '@/components/ui';
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';
import { Leaderboard } from './Leaderboard';

export function Overview() {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="mb-6">
          <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">{displayName}'s Portfolio</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 -mt-4">See how your assets are performing!</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <Icon icon={WarningCircleIcon} size="md" className="text-red-400 dark:text-red-500 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Unable to load portfolio data</h4>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="mb-6">
        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">{displayName}'s Portfolio</h5>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buying Power */}
        <div className="bg-[#FEF100] rounded-lg p-4">
          <div className="flex items-baseline justify-between -mb-4">
            <p className="text-sm font-medium text-gray-900 leading-none">Buying Power</p>
            
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-mono !mb-0">
            {loading ? '$---.--' : `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </h2>
        </div>

        {/* Days Remaining */}
        <div className="bg-gray-600 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-baseline justify-between -mb-4">
            <p className="text-sm font-medium text-white leading-none">Days Remaining</p>
            
          </div>
          <h2 className="text-2xl font-bold text-white font-mono !mb-0">
            {loading ? '--' : daysRemaining}
          </h2>
        </div>

        {/* Current Rank */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-baseline justify-between -mb-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">Current Rank</p>
            
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono !mb-0">
            {loading ? '--' : currentUserRank} <span className="text-lg text-gray-700 dark:text-gray-300">of</span> {loading ? '--' : totalUsers.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Enhanced Portfolio Section */}
      <div className="mt-8 flex flex-row items-end gap-12 min-h-[400px]">
        {/* Left Column - Portfolio Actions & Metrics */}
        <div className="flex flex-col justify-end space-y-2">
          {/* View Full Portfolio Button */}
          <button className="flex items-center justify-between p-2 mb-4 border border-gray-900 dark:border-gray-100 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group self-start">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">View Full Portfolio</span>
            <Icon icon={CaretRightIcon} size="sm" className="text-gray-900 dark:text-gray-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Portfolio Performance Since Start */}
          <div className="p-0">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono !mb-0">
              {loading ? '--.--%' : 
                totalUnrealizedPnLPercent >= 0 
                  ? `+${totalUnrealizedPnLPercent.toFixed(2)}%` 
                  : `${totalUnrealizedPnLPercent.toFixed(2)}%`
              }
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Return</p>

          </div>

          {/* Current Portfolio Balance */}
          <div className="p-0">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono !mb-0">
              {loading ? '$---.--' : `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Portfolio Value</p>

          </div>
        </div>
        
        {/* Right Column - Category Growth Chart */}
        <div className="flex-1 min-w-0 flex justify-end items-end">
          <div className="w-full">
            <PortfolioPerformanceChart />
          </div>
        </div>
      </div>
    </div>
  );
}