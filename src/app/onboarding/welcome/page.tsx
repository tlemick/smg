'use client';

import { useRouter } from 'next/navigation';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Icon } from '@/components/ui';
import { CaretRightIcon } from '@/components/ui';

export default function OnboardingWelcomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/stocks');
  };

  const handleSkipToBoard = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <div className="max-w-5xl mx-auto pb-24">
        {/* Hero Section */}
        <div className="text-left mb-12 mt-12">

          <h2 className="text-2xl font-semibold mb-3">
            Welcome to the Stock Market Game!
          </h2>
          <p className="text-left text-muted-foreground mb-8">
            You're about to embark on an exciting journey to learn investing. We'll help you build your first portfolio and compete with your peers.
          </p>
        </div>

        {/* Three Main Phases */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Phase 1: Picking Assets */}
          <Card className="overflow-hidden">
            <div className="aspect-square bg-background flex items-center justify-center p-8">
              <img
                src="/onboarding_images/a.webp"
                alt="Picking Assets"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Picking Assets</CardTitle>
              <CardDescription>
                Explore and select stocks from various industries. Learn about different companies and build your investment knowledge through our curated selection.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>

          {/* Phase 2: Analyzing and Making Decisions */}
          <Card className="overflow-hidden">
            <div className="aspect-square bg-background flex items-center justify-center p-8">
              <img
                src="/onboarding_images/b.webp"
                alt="Analyzing and Making Decisions"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Making Decisions</CardTitle>
              <CardDescription>
                Research market trends, analyze performance data, and make informed trading decisions. Use our tools to understand market dynamics and timing.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>

          {/* Phase 3: Watching Progress */}
          <Card className="overflow-hidden">
            <div className="aspect-square bg-background flex items-center justify-center p-8">
              <img
                src="/onboarding_images/c.webp"
                alt="Watching Progress"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Watching Progress</CardTitle>
              <CardDescription>
                Track your portfolio performance, monitor gains and losses, and compete with other investors. Learn from your successes and improve your strategy.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="group"
          >
            Let's Build Your Portfolio!
            <Icon icon={CaretRightIcon} size="md" className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't worry, you can always come back to this guide. We'll walk you through each step!
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleSkipToBoard}
          variant="secondary"
        >
          Skip to Dashboard
        </Button>
      </div>
    </>
  );
}



