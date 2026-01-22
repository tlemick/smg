import { NextResponse } from 'next/server';
import { MarketStateService } from '@/lib/market-state-service';

/**
 * Market State API Endpoint
 * 
 * Returns current market state information for client-side validation
 * Used by TradeDrawer to determine if market orders are available
 */
export async function GET() {
  try {
    const marketState = await MarketStateService.getCurrentMarketState();
    
    return NextResponse.json({
      success: true,
      marketState: marketState.marketState,
      isOpen: marketState.isOpen,
      canExecuteOrders: marketState.canExecuteOrders,
      message: marketState.message,
      nextTradingSession: marketState.nextTradingSession,
    });
  } catch (error) {
    console.error('Failed to get market state:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get market state',
        // Default to market open assumption on error
        marketState: 'REGULAR',
        isOpen: true,
        canExecuteOrders: true,
        message: 'Market state unavailable - assuming open',
      },
      { status: 500 }
    );
  }
}
