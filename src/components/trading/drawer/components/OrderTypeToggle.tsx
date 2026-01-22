'use client';

import { Button } from '@/components/ui/button';

interface OrderTypeToggleProps {
  orderType: 'MARKET' | 'LIMIT';
  onChange: (orderType: 'MARKET' | 'LIMIT') => void;
  disabled?: boolean;
  marketOrderDisabled?: boolean;
  marketOrderWarning?: string | null;
}

/**
 * Minimal toggle for order type selection
 * 
 * Options:
 * - Market Order (execute immediately) - can be disabled when market is closed
 * - Limit Order (set target price)
 */
export function OrderTypeToggle({
  orderType,
  onChange,
  disabled = false,
  marketOrderDisabled = false,
  marketOrderWarning,
}: OrderTypeToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex bg-muted rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 ${
            orderType === 'MARKET'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          } ${marketOrderDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => onChange('MARKET')}
          disabled={disabled || marketOrderDisabled}
          title={
            marketOrderDisabled
              ? marketOrderWarning || 'Market orders not available when market is closed'
              : undefined
          }
        >
          Market
          {marketOrderDisabled && (
            <span className="ml-1 text-xs" role="img" aria-label="locked">
              🔒
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 ${
            orderType === 'LIMIT'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
          onClick={() => onChange('LIMIT')}
          disabled={disabled}
        >
          Limit
        </Button>
      </div>

      {marketOrderDisabled && orderType === 'MARKET' && marketOrderWarning && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          {marketOrderWarning}
        </p>
      )}
    </div>
  );
}
