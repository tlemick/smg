'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Icon, TargetIcon, TrendUpIcon, TrophyIcon } from '@/components/ui';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [isCompleting, setIsCompleting] = useState(true);
  const [portfolioStats, setPortfolioStats] = useState({
    totalInvested: 0,
    stocks: 0,
    funds: 0,
    bonds: 0,
    remainingCash: 0,
  });

  useEffect(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = async () => {
    try {
      // Get portfolio stats first
      const statusResponse = await fetch('/api/onboarding/status');
      const statusData = await statusResponse.json();

      if (statusData.success) {
        const stocksValue = statusData.portfolio.stocksValue || 0;
        const fundsValue = statusData.portfolio.mutualFundsValue || 0;
        const bondsValue = statusData.portfolio.bondsValue || 0;
        const totalInvested = stocksValue + fundsValue + bondsValue;
        
        setPortfolioStats({
          totalInvested,
          stocks: stocksValue,
          funds: fundsValue,
          bonds: bondsValue,
          remainingCash: statusData.portfolio.cashBalance,
        });
      }

      // Small delay to show the portfolio summary before marking complete
      setTimeout(async () => {
        try {
          // Mark onboarding as complete
          const completeResponse = await fetch('/api/user/complete-onboarding', {
            method: 'PATCH',
          });

          if (completeResponse.ok) {
            const completeData = await completeResponse.json();
            
            // Update UserContext with the updated user data
            if (completeData.success && completeData.user && user) {
              setUser({
                ...user,
                hasCompletedOnboarding: true
              });
            }
            
            setIsCompleting(false);
            
            // Redirect to dashboard after 5 seconds
            setTimeout(() => {
              router.push('/dashboard');
            }, 5000);
          } else {
            console.error('Failed to complete onboarding');
            setIsCompleting(false);
          }
        } catch (err) {
          console.error('Error marking onboarding complete:', err);
          setIsCompleting(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-6">
        {/* Success Animation */}
        <div className="relative py-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4 animate-bounce">
            <span className="text-5xl">🎉</span>
          </div>
        </div>

        {/* Main Message */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Congratulations! 🏆
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
            You've Built Your First Portfolio!
          </p>
          <p className="text-base text-gray-600 dark:text-gray-400">
            You're now ready to compete in the Stock Market Game
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Icon icon={TrophyIcon} size="lg" className="text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Your Portfolio Summary
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Total Invested */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Invested</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(portfolioStats.totalInvested)}
              </div>
            </div>

            {/* Cash Remaining */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cash Available</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(portfolioStats.remainingCash)}
              </div>
            </div>
          </div>

          {/* Asset Breakdown */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stocks</div>
              <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                {portfolioStats.stocks > 0 ? formatCurrency(portfolioStats.stocks) : '—'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Funds</div>
              <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                {portfolioStats.funds > 0 ? formatCurrency(portfolioStats.funds) : '—'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🏦</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bonds</div>
              <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                {portfolioStats.bonds > 0 ? formatCurrency(portfolioStats.bonds) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Ready to Start Section */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-center">
            <Icon icon={TargetIcon} size="md" className="mr-2 text-purple-600 dark:text-purple-400" />
            You're Ready to Compete!
          </h3>
          <p className="text-base text-gray-700 dark:text-gray-300">
            Monitor your portfolio, keep investing, compete with peers, and beat the S&P 500. Your journey to becoming a savvy investor starts now!
          </p>
        </div>

        {/* Action Button */}
        <div>
          {!isCompleting && (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Redirecting to your dashboard in a few seconds...
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
              >
                Go to Dashboard Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

