'use client';

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { PortfolioTreemap, InvestmentProjectionsCalculator, PerformanceHighlights, ExploreWinningPortfolios } from '@/components/portfolio';
import { CircleNotchIcon, Icon } from '@/components/ui';

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
    <div className="space-y-2">
      {/* Page container: spacing and background only; borders go on individual cards below */}
      <div className="bg-card flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-sans text-foreground">
            Your Portfolio
          </h1>
        </div>

        <div className="space-y-6 pb-8">
          <PortfolioTreemap />
          <PerformanceHighlights />
          <ExploreWinningPortfolios />
          <InvestmentProjectionsCalculator />
        </div>
      </div>
    </div>
  );
}

