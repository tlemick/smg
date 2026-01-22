'use client';

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Command } from '@phosphor-icons/react';
import { CircleNotchIcon, Icon } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  TrendingTab,
  ConsumerBrandsTab,
  DividendAristocratsTab,
  PennyStocksTab,
} from '@/components/trade';

/**
 * Trade Ideas Page
 * 
 * Educational page suggesting stocks across 4 categories to help students discover assets:
 * 1. Hype Train - Trending/viral stocks
 * 2. Stuff You Buy - Consumer brands
 * 3. Safe & Steady - Dividend aristocrats
 * 4. Cheap Seats - Penny stocks
 */
export default function TradePage() {
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
        <div className="flex items-center gap-2">
          <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-20">
        <h1 className="text-3xl font-mono text-foreground leading-none">
          Trade Ideas
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Search in the bar above to find assets to add to your portfolio or use <span className="bg-muted text-xs text-foreground px-2 py-1 rounded-md inline-flex items-center gap-1"><Command size={16} weight="regular" />CMND + K</span> to open the global search. Explore the assets in the tab below to find some asset classes that you might have be aware of!
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="hype-train" className="w-full">
        <TabsList>
          <TabsTrigger value="hype-train">Hype Train</TabsTrigger>
          <TabsTrigger value="consumer">Stuff You Buy</TabsTrigger>
          <TabsTrigger value="dividend">Safe & Steady</TabsTrigger>
          <TabsTrigger value="penny">Cheap Seats</TabsTrigger>
        </TabsList>

        <TabsContent value="hype-train" className="mt-8">
          <TrendingTab />
        </TabsContent>

        <TabsContent value="consumer" className="mt-8">
          <ConsumerBrandsTab />
        </TabsContent>

        <TabsContent value="dividend" className="mt-8">
          <DividendAristocratsTab />
        </TabsContent>

        <TabsContent value="penny" className="mt-8">
          <PennyStocksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

