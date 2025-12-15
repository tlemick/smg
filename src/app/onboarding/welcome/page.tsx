'use client';

import { useRouter } from 'next/navigation';


import { CaretRightIcon, Icon, TrophyIcon, UsersIcon } from '@/components/ui';

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

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Welcome to the Stock Market Game!
          </h2>
          <p className="text-left text-gray-600 dark:text-gray-400  mb-8">
            You're about to embark on an exciting journey to learn investing. We'll help you build your first portfolio and compete with your peers.
          </p>
        </div>

        {/* Three Main Phases */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Phase 1: Picking Assets */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="aspect-square bg-white dark:bg-white flex items-center justify-center p-8">
              <img
                src="/onboarding_images/a.webp"
                alt="Picking Assets"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                Picking Assets
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Explore and select stocks from various industries. Learn about different companies and build your investment knowledge through our curated selection.
              </p>
            </div>
          </div>

          {/* Phase 2: Analyzing and Making Decisions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="aspect-square bg-white dark:bg-white flex items-center justify-center p-8">
              <img
                src="/onboarding_images/b.webp"
                alt="Analyzing and Making Decisions"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                Making Decisions
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Research market trends, analyze performance data, and make informed trading decisions. Use our tools to understand market dynamics and timing.
              </p>
            </div>
          </div>

          {/* Phase 3: Watching Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="aspect-square bg-white dark:bg-white flex items-center justify-center p-8">
              <img
                src="/onboarding_images/c.webp"
                alt="Watching Progress"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                Watching Progress
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Track your portfolio performance, monitor gains and losses, and compete with other investors. Learn from your successes and improve your strategy.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGetStarted}
            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            Let's Build Your Portfolio!
            <Icon icon={CaretRightIcon} size="md" className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't worry, you can always come back to this guide. We'll walk you through each step!
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleSkipToBoard}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
        >
          Skip to Dashboard
        </button>
      </div>
    </>
  );
}



