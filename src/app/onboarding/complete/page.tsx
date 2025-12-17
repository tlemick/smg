'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Button, Card, CardContent, CardHeader, CardTitle, Icon, TargetIcon, TrophyIcon } from '@/components/ui';

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
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary rounded-full mb-4 animate-bounce shadow">
            <span className="text-5xl">🎉</span>
          </div>
        </div>

        {/* Main Message */}
        <div>
          <h1 className="text-4xl font-semibold font-mono text-foreground mb-3">
            Congratulations! 🏆
          </h1>
          <p className="text-xl text-foreground mb-2">
            You've Built Your First Portfolio!
          </p>
          <p className="text-base text-muted-foreground">
            You're now ready to compete in the Stock Market Game
          </p>
        </div>

        {/* Portfolio Summary */}
        <Card className="rounded-2xl shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-center space-x-2">
              <Icon icon={TrophyIcon} size="lg" className="text-chart-4" />
              <CardTitle className="text-xl">Your Portfolio Summary</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Total Invested */}
              <div className="bg-muted rounded-xl p-4 border border-border">
                <div className="text-sm text-muted-foreground mb-1">Total Invested</div>
                <div className="text-2xl font-semibold text-primary">
                {formatCurrency(portfolioStats.totalInvested)}
                </div>
              </div>

            {/* Cash Remaining */}
              <div className="bg-muted rounded-xl p-4 border border-border">
                <div className="text-sm text-muted-foreground mb-1">Cash Available</div>
                <div className="text-2xl font-semibold text-chart-positive">
                {formatCurrency(portfolioStats.remainingCash)}
                </div>
              </div>
            </div>

          {/* Asset Breakdown */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
                <div className="text-sm text-muted-foreground">Stocks</div>
                <div className="text-base font-semibold text-foreground">
                {portfolioStats.stocks > 0 ? formatCurrency(portfolioStats.stocks) : '—'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
                <div className="text-sm text-muted-foreground">Funds</div>
                <div className="text-base font-semibold text-foreground">
                {portfolioStats.funds > 0 ? formatCurrency(portfolioStats.funds) : '—'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🏦</div>
                <div className="text-sm text-muted-foreground">Bonds</div>
                <div className="text-base font-semibold text-foreground">
                {portfolioStats.bonds > 0 ? formatCurrency(portfolioStats.bonds) : '—'}
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Ready to Start Section */}
        <div className="bg-primary/10 rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center justify-center">
            <Icon icon={TargetIcon} size="md" className="mr-2 text-primary" />
            You're Ready to Compete!
          </h3>
          <p className="text-base text-muted-foreground">
            Monitor your portfolio, keep investing, compete with peers, and beat the S&P 500. Your journey to becoming a savvy investor starts now!
          </p>
        </div>

        {/* Action Button */}
        <div>
          {!isCompleting && (
            <div>
              <p className="text-muted-foreground mb-3">
                Redirecting to your dashboard in a few seconds...
              </p>
              <Button onClick={() => router.push('/dashboard')} size="lg">
                Go to Dashboard Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

