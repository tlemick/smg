'use client';

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { LeaderboardCard } from '@/components/dashboard';
import { CircleNotchIcon, Icon } from '@/components/ui';

export default function LeaderboardPage() {
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
          <span className="text-lg text-muted-foreground">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return <LeaderboardCard />;
}

