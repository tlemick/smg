'use client';

interface OnboardingSidebarContentProps {
  cashBalance: number;
  children?: React.ReactNode;
}

export function OnboardingSidebarContent({ cashBalance, children }: OnboardingSidebarContentProps) {
  return (
    <div className="space-y-4">
      {/* Cash Balance */}
      <div className=" p-3 border-t border-b border-neutral-700 dark:border-neutral-600">
        <div className="text-left">
          <div className="text-xs font-medium text-neutral-800 dark:text-neutral-400 mb-1">
            Cash Available
          </div>
          <div className="text-2xl font-bold text-black dark:text-white">
            ${cashBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Additional content (suggestions, trending, etc.) */}
      {children}
    </div>
  );
}

