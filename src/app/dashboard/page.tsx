'use client';

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { PortfolioCard, Watchlists, TransactionsCard, LeaderboardCard, LessonsCard } from '@/components/dashboard';
import { CircleNotchIcon, Icon } from '@/components/ui';

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  // Show loading while checking authentication or redirecting
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content - 2 Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Portfolio + Watchlists (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <PortfolioCard />
          <Watchlists />
        </div>
        
        {/* Right: Sidebar widgets (1/3 width) */}
        <div className="space-y-6">
          <TransactionsCard />
          <LeaderboardCard />
        </div>
      </div>
      
      {/* Full Width - Lessons */}
      <LessonsCard />
    </div>
  );
} 