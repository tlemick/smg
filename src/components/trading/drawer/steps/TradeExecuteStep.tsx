'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface TradeExecuteStepProps {
  orderType: 'BUY' | 'SELL';
  onComplete: () => void;
  minDisplayTime?: number; // Minimum time to show this screen (ms)
}

/**
 * Step 3: Execution
 * 
 * Features:
 * - Full-screen colored background (green for buy, red for sell)
 * - Animated loading indicator
 * - Automatic progression to next step
 * - Minimum display time for intentional feel
 */
export function TradeExecuteStep({
  orderType,
  onComplete,
  minDisplayTime = 1500,
}: TradeExecuteStepProps) {
  const isBuy = orderType === 'BUY';

  useEffect(() => {
    // Ensure minimum display time
    const timer = setTimeout(() => {
      onComplete();
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isBuy ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <div className="text-center space-y-6 text-white">
        {/* Animated Logo/Icon */}
        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 animate-spin" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Executing your order...</h2>
          <p className="text-white/80">This will only take a moment</p>
        </div>
      </div>
    </div>
  );
}
