'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Overview, Watchlists, Transactions, Leaderboard, TikTokLessons } from '@/components/dashboard';
import { MainNavigation } from '@/components/navigation';
import { Container, Grid, Section, Footer } from '@/components/layout';

export default function DashboardPage() {
  const { user, isLoading, logout } = useUser();
  const router = useRouter();
  
  // Height matching state and refs
  const [overviewHeight, setOverviewHeight] = useState<number>(0);
  const overviewRef = useRef<HTMLDivElement>(null);
  const transactionsRef = useRef<HTMLDivElement>(null);

  // Height matching effect
  useEffect(() => {
    const measureOverviewHeight = () => {
      if (overviewRef.current) {
        const height = overviewRef.current.getBoundingClientRect().height;
        setOverviewHeight(height);
      }
    };

    // Initial measurement
    measureOverviewHeight();

    // Set up ResizeObserver to watch for changes
    let resizeObserver: ResizeObserver | null = null;
    
    if (overviewRef.current) {
      resizeObserver = new ResizeObserver(() => {
        measureOverviewHeight();
      });
      resizeObserver.observe(overviewRef.current);
    }

    // Also listen for window resize
    const handleResize = () => {
      measureOverviewHeight();
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [user, isLoading]); // Re-run when user data changes

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-lg text-neutral-600 dark:text-neutral-400">Loading dashboard...</span>
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
          {/* Header */}
          

          {/* Dashboard Layout: Height-matched grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - 8 columns */}
            <div className="lg:col-span-8 space-y-6">
              <div ref={overviewRef}>
                <Overview />
              </div>
              <Watchlists />
            </div>

            {/* Right Column - 4 columns */}
            <div className="lg:col-span-4 space-y-6">
              <div 
                ref={transactionsRef}
                style={{ height: overviewHeight > 0 ? `${overviewHeight}px` : 'auto' }}
              >
                <Transactions />
              </div>
              <Leaderboard />
            </div>
          </div>

          {/* TikTok-style Lessons Section - Full width row */}
          <div className="mt-8">
            <TikTokLessons />
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 