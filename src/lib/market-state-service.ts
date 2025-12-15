import { getAssetQuoteWithCache } from './yahoo-finance-service';

// Market state values from Yahoo Finance API
export type MarketState = 'REGULAR' | 'CLOSED' | 'PRE' | 'POST' | 'PREPRE' | 'POSTPOST';

export interface MarketStateInfo {
  marketState: MarketState;
  isOpen: boolean;
  canExecuteOrders: boolean;
  nextTradingSession?: Date;
  message: string;
}

/**
 * Market State Service that leverages existing AssetQuoteCache.marketState
 * This service provides educational trading logic for determining order execution
 */
export class MarketStateService {
  
  /**
   * Get current market state using existing infrastructure
   * Uses SPY (S&P 500 ETF) as a liquid market indicator
   */
  static async getCurrentMarketState(): Promise<MarketStateInfo> {
    try {
      // First try to get SPY as a reliable market indicator
      const spyAsset = await this.findAssetByTicker('SPY');
      
      if (spyAsset) {
        const spyQuote = await getAssetQuoteWithCache(spyAsset.id);
        
        if (spyQuote.marketState) {
          return this.interpretMarketState(spyQuote.marketState as MarketState);
        }
      }
      
      // Fallback: try other common assets
      const fallbackTickers = ['AAPL', 'MSFT', 'GOOGL'];
      
      for (const ticker of fallbackTickers) {
        try {
          const asset = await this.findAssetByTicker(ticker);
          if (asset) {
            const quote = await getAssetQuoteWithCache(asset.id);
            if (quote.marketState) {
              return this.interpretMarketState(quote.marketState as MarketState);
            }
          }
        } catch (error) {
          console.warn(`Failed to get market state from ${ticker}:`, error);
          continue;
        }
      }
      
      // Default fallback based on EST business hours
      return this.getDefaultMarketState();
      
    } catch (error) {
      console.error('Failed to get market state:', error);
      return this.getDefaultMarketState();
    }
  }
  
  /**
   * Helper to find asset by ticker
   */
  private static async findAssetByTicker(ticker: string) {
    const { prisma } = await import('../../prisma/client');
    return await prisma.asset.findUnique({
      where: { ticker: ticker.toUpperCase() }
    });
  }
  
  /**
   * Interpret Yahoo Finance market state into trading logic
   */
  private static interpretMarketState(marketState: MarketState): MarketStateInfo {
    switch (marketState) {
      case 'REGULAR':
        return {
          marketState,
          isOpen: true,
          canExecuteOrders: true,
          message: 'Market is open - orders will execute immediately at current market prices',
        };
        
      case 'PRE':
        return {
          marketState,
          isOpen: false,
          canExecuteOrders: false,
          nextTradingSession: this.getNextRegularSession(),
          message: 'Pre-market session - your order will be queued for market open at 9:30 AM ET',
        };
        
      case 'POST':
        return {
          marketState,
          isOpen: false,
          canExecuteOrders: false,
          nextTradingSession: this.getNextRegularSession(),
          message: 'After-hours session - your order will be queued for next trading day',
        };
        
      case 'CLOSED':
      case 'PREPRE':
      case 'POSTPOST':
      default:
        return {
          marketState,
          isOpen: false,
          canExecuteOrders: false,
          nextTradingSession: this.getNextRegularSession(),
          message: 'Market is closed - your order will be queued for the next trading day',
        };
    }
  }
  
  /**
   * Calculate next regular trading session (simplified version)
   * For educational purposes - assumes NYSE schedule
   */
  private static getNextRegularSession(): Date {
    const now = new Date();
    const nextSession = new Date(now);
    
    // Simple logic: next weekday at 9:30 AM ET
    // This could be enhanced with holiday detection
    
    // If it's Friday after market close, jump to Monday
    if (now.getDay() === 5 && now.getHours() >= 16) { // Friday after 4 PM
      nextSession.setDate(now.getDate() + 3); // Monday
    }
    // If it's Saturday or Sunday, go to Monday
    else if (now.getDay() === 6) { // Saturday
      nextSession.setDate(now.getDate() + 2); // Monday
    }
    else if (now.getDay() === 0) { // Sunday
      nextSession.setDate(now.getDate() + 1); // Monday
    }
    // If it's a weekday after market close, go to next day
    else if (now.getHours() >= 16) {
      nextSession.setDate(now.getDate() + 1);
    }
    
    // Set to 9:30 AM ET (assuming server is in ET timezone)
    nextSession.setHours(9, 30, 0, 0);
    
    return nextSession;
  }
  
  /**
   * Default market state when API data is unavailable
   */
  private static getDefaultMarketState(): MarketStateInfo {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Simple weekday 9:30 AM - 4:00 PM ET check
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 9 && hour < 16;
    
    if (isWeekday && isMarketHours) {
      return {
        marketState: 'REGULAR',
        isOpen: true,
        canExecuteOrders: true,
        message: 'Market appears to be open - orders will execute immediately',
      };
    } else {
      return {
        marketState: 'CLOSED',
        isOpen: false,
        canExecuteOrders: false,
        nextTradingSession: this.getNextRegularSession(),
        message: 'Market appears to be closed - orders will be queued for next trading day',
      };
    }
  }
  
  /**
   * Educational helper: Get market state with detailed explanation
   */
  static async getMarketStateWithEducation(): Promise<MarketStateInfo & { educationalNote: string }> {
    const marketInfo = await this.getCurrentMarketState();
    
    let educationalNote = '';
    
    if (marketInfo.isOpen) {
      educationalNote = `
        💡 The market is currently open! When you place an order now:
        • Market orders execute immediately at the current price
        • You'll pay the "ask" price when buying, receive the "bid" price when selling
        • Prices can change rapidly during market hours
        • Your order will appear in your portfolio immediately upon execution
      `.trim();
    } else {
      educationalNote = `
        📚 The market is currently closed. When you place an order now:
        • Your order joins a queue and will execute when the market opens
        • You'll get the opening price, which may differ from the current quote
        • Market orders placed when closed become "market-on-open" orders
        • This teaches you about market timing and order types
      `.trim();
    }
    
    return {
      ...marketInfo,
      educationalNote,
    };
  }
  
  /**
   * Check if an order should execute immediately or be queued
   */
  static async shouldExecuteOrderImmediately(): Promise<boolean> {
    const marketState = await this.getCurrentMarketState();
    return marketState.canExecuteOrders;
  }
  
  /**
   * Get user-friendly market status for UI display
   */
  static async getMarketStatusForUI(): Promise<{
    status: 'open' | 'closed' | 'pre-market' | 'after-hours';
    displayText: string;
    color: 'green' | 'red' | 'yellow' | 'blue';
    canTrade: boolean;
  }> {
    const marketInfo = await this.getCurrentMarketState();
    
    switch (marketInfo.marketState) {
      case 'REGULAR':
        return {
          status: 'open',
          displayText: 'Market Open',
          color: 'green',
          canTrade: true,
        };
        
      case 'PRE':
        return {
          status: 'pre-market',
          displayText: 'Pre-Market',
          color: 'blue',
          canTrade: false,
        };
        
      case 'POST':
        return {
          status: 'after-hours',
          displayText: 'After Hours',
          color: 'yellow',
          canTrade: false,
        };
        
      default:
        return {
          status: 'closed',
          displayText: 'Market Closed',
          color: 'red',
          canTrade: false,
        };
    }
  }
} 