'use client';

import { OnboardingStep } from '@/types';
import { CheckIcon, Icon } from '@/components/ui';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
}

const steps: { id: OnboardingStep; label: string; number: string }[] = [
  { id: 'welcome', label: 'How to play', number: '1' },
  { id: 'stocks', label: 'Buying Stocks', number: '2' },
  { id: 'mutual-funds', label: 'Buying Mutual Funds', number: '3' },
  { id: 'bonds', label: 'Buying Bonds', number: '4' },
  { id: 'complete', label: 'Finish', number: '5' },
];

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="space-y-0">
      <p>Welcome to the Stock Market Game!</p>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={step.id} className="relative">
            {/* Step Item */}
            <div className="flex items-center space-x-3 px-4 py-4 transition-all">
              {/* Number or Check */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold
                  ${
                    isCurrent
                      ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                      : isCompleted
                      ? 'bg-neutral-800 dark:bg-neutral-200 text-neutral-200 dark:text-neutral-800'
                      : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400'
                  }
                `}
              >
                {isCompleted ? (
                  <Icon icon={CheckIcon} size="sm" />
                ) : (
                  <span className="text-sm">{step.number}</span>
                )}
              </div>

              {/* Label */}
              <div
                className={`
                  font-semibold text-sm
                  ${
                    isCurrent
                      ? 'text-emerald-600 dark:text-emerald-600'
                      : isCompleted
                      ? 'text-neutral-700 dark:text-neutral-300'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }
                `}
              >
                {step.label}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  absolute left-8 top-12 w-0.5 h-8 transition-all
                  ${
                    isCompleted
                      ? 'bg-neutral-700 dark:bg-neutral-300'
                      : isCurrent
                      ? 'bg-neutral-4300 dark:bg-neutral-600'
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

