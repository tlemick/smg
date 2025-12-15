'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { MainNavigation } from '@/components/navigation';
import { PortfolioTreemap, InvestmentProjectionsCalculator, PerformanceHighlights, ExploreWinningPortfolios } from '@/components/portfolio';
import { Container, Section, Footer } from '@/components/layout';
import { Highlight } from '@/components/ui';

export default function PortfolioPage() {
  const { user, isLoading, logout } = useUser();
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-lg text-gray-600 dark:text-gray-400">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <MainNavigation />

      <Section spacing="lg">
        <Container>
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Your Portfolio
            </h1>
            <p className="text-gray-900 dark:text-gray-100 -mt-4 leading-none max-w-prose">
              In this section you can see all your <Highlight>assets by size and performance</Highlight> in the treemap. Get some advice on what to do with <Highlight>winners, losers</Highlight>, and the assets that don't seem to be doing much at all. Also, check out <Highlight>some past portfolios</Highlight> with an analysis on why they performed so well!
            </p>
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
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 