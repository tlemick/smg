'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { WatchlistSelectionModal } from './WatchlistSelectionModal';
import { LessonButton } from '@/components/ui/LessonButton';
import { createModalClasses, createPopoverClasses } from '@/lib/positioning';

// Trade icon SVG component
const TradeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

interface AssetTopActionsProps {
  asset: {
    id: number;
    ticker: string;
    name: string;
    allowFractionalShares: boolean;
  };
  authenticated: boolean;
  hasHoldings: boolean;
}

export function AssetTopActions({ asset, authenticated, hasHoldings }: AssetTopActionsProps) {
  const router = useRouter();

  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const tradeRef = useRef<HTMLDivElement | null>(null);

  // Simple outside click handler for the trade popover
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      if (!isTradeOpen) return;
      const target = e.target as Node;
      if (tradeRef.current && !tradeRef.current.contains(target)) {
        setIsTradeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [isTradeOpen]);

  const handleBuyClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    const returnUrl = `/asset/${asset.ticker}`;
    router.push(`/trade/buy/${asset.ticker}?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  const handleSellClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (!hasHoldings) {
      return;
    }
    const returnUrl = `/asset/${asset.ticker}`;
    router.push(`/trade/sell/${asset.ticker}?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  const handleWatchlistClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setIsWatchlistModalOpen(true);
  };


  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 relative">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Trade popover */}
          <div className={createPopoverClasses().container} ref={tradeRef}>
            <button
              onClick={() => setIsTradeOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-[#FEF100] border-2 border-gray-900 dark:border-gray-100 hover:bg-yellow-300 dark:hover:bg-yellow-400 text-gray-900 font-medium shadow-sm transition-colors"
              aria-haspopup="menu"
              aria-expanded={isTradeOpen}
            >
              <TradeIcon className="w-4 h-4" />
              Trade {asset.ticker}
            </button>

            {isTradeOpen && (
              <div
                role="menu"
                className={`${createPopoverClasses().content} left-0 bottom-full mb-2 flex flex-col min-w-full`}
                style={{ minWidth: tradeRef.current?.offsetWidth || 'auto' }}
              >
                <button
                  onClick={handleBuyClick}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors rounded-t-lg border-b border-gray-200"
                >
                  Buy {asset.ticker}
                </button>
                <button
                  onClick={handleSellClick}
                  disabled={!hasHoldings}
                  className={`w-full px-4 py-2.5 text-sm font-medium transition-colors rounded-b-lg ${
                    hasHoldings
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Sell {asset.ticker}
                </button>
              </div>
            )}
          </div>

          {/* Watchlist */}
          <button
            onClick={handleWatchlistClick}
            className="px-4 py-2 text-xs rounded-full border-2 bg-white border-gray-900 text-gray-900 hover:bg-gray-900/5 font-medium"
          >
            Add to Watchlist
          </button>
        </div>

        {/* Lesson button on the right */}
        <LessonButton
          text="Anita Explains Price Charts"
          topics={["Pricing Basics", "Analysis Skills"]}
          maxItems={1}
          modalLayout="dual"
          modalContent={
            <div className="flex flex-col gap-2 p-8">
              <h3 className="text-lg font-semibold text-gray-900">About this video</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-prose">
              Hey everyone! Let's break down a stock chart so it's not so intimidating. Think of a stock chart as a simple story of a company's price over a period of time. The line you see moving from left to right tracks the stock's price on the vertical axis against time on the horizontal axis. Most charts use "candlesticks" to show you what happened each day. Each candle has a thick part called the body and thin lines called wicks. The body shows you where the price opened and closed for the day; if it's green, the price went up, and if it's red, it went down. The wicks show the highest and lowest prices the stock hit that day. By looking at just one candle, you get a full snapshot of that day's trading drama. 📈
              </p>
              <p className="mt-2 text-sm text-gray-600 max-w-prose">
                Now, look at the bar graphs at the bottom of the chart—that's the volume. Volume tells you how many shares were traded that day and shows how much interest or excitement there was around the stock. A big price move on high volume is like a cheer from a huge crowd; it suggests the move has a lot of strength. When you zoom out and look at all the candlesticks and volume bars together, you can start to see trends. If the price is generally making higher highs and higher lows, it's in an uptrend. If it's making lower highs and lower lows, it's in a downtrend. Reading these basic signals—the daily candle, the volume, and the overall trend—is the first step to understanding what the chart is telling you.
              </p>
            </div>
          }
        />
      </div>

      {/* Modals */}
      <WatchlistSelectionModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        ticker={asset.ticker}
        assetName={asset.name}
      />

      {showLoginPrompt && createPortal(
        <div className={createModalClasses().backdrop} onClick={() => setShowLoginPrompt(false)}>
          <div className={createModalClasses().container}>
            <div className={createModalClasses().content} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Login Required</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Please log in to trade and manage watchlists for {asset.ticker}.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Log In
              </button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


