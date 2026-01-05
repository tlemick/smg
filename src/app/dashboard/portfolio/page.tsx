'use client';

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { PortfolioTreemap, InvestmentProjectionsCalculator, PerformanceHighlights, ExploreWinningPortfolios } from '@/components/portfolio';
import { Highlight, CircleNotchIcon, Icon } from '@/components/ui';

export default function PortfolioPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  // Show loading while checking authentication
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-mono text-foreground">
            Your portfolio
        </h1>
        {/* <p className="text-foreground mt-2 max-w-prose">
          In this section you can see all your <Highlight>assets by size and performance</Highlight> in the treemap. Get some advice on what to do with <Highlight>winners, losers</Highlight>, and the assets that don't seem to be doing much at all. Also, check out <Highlight>some past portfolios</Highlight> with an analysis on why they performed so well!
        </p> */}
      </div>

      {/* Portfolio Content */}
      <div className="space-y-12">
        {/* Portfolio Treemap */}
        <PortfolioTreemap />

        {/* Performance Highlights - Full Width */}
        <PerformanceHighlights />

        {/* Explore Winning Portfolios - Full Width */}
        <ExploreWinningPortfolios />

        {/* Investment Projections Calculator */}
        <InvestmentProjectionsCalculator />
      </div>
    </div>
  );
}

