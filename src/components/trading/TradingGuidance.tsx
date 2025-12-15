'use client';

import { TradingGuidanceProps, EducationalSection } from '@/types';

export function TradingGuidance({ 
  orderType, 
  tradeType, 
  asset, 
  marketState,
  isFirstTime = false,
  showRiskWarnings = true 
}: TradingGuidanceProps) {
  const getMarketStateIcon = () => {
    switch (marketState) {
      case 'REGULAR': return '🟢';
      case 'PRE': return '🟡';
      case 'POST': return '🟡';
      case 'CLOSED': return '🔴';
      default: return '❓';
    }
  };

  const getMarketStateMessage = () => {
    switch (marketState) {
      case 'REGULAR': 
        return 'Market is open - orders execute immediately at current market price';
      case 'PRE': 
        return 'Pre-market trading - market orders are disabled, but limit orders can be placed and will activate during regular hours';
      case 'POST': 
        return 'After-hours trading - market orders are disabled, but limit orders can be placed for next trading session';
      case 'CLOSED': 
        return 'Market is closed - market orders are disabled to protect you from stale prices, but limit orders can be placed for when market reopens';
      default: 
        return 'Unable to determine market status';
    }
  };

  const getOrderTypeEducation = (): EducationalSection[] => {
    if (tradeType === 'MARKET') {
      return [
        {
          title: '⚡ Market Order',
          description: `Execute immediately at the best available price. ${orderType === 'BUY' ? 'You\'ll buy at the current ask price' : 'You\'ll sell at the current bid price'}.`,
          icon: '⚡',
          level: 'beginner'
        },
        {
          title: '🎯 Execution Speed',
          description: 'Market orders prioritize speed over price. Good for liquid stocks when you want immediate execution.',
          icon: '🎯',
          level: 'beginner'
        }
      ];
    } else {
      return [
        {
          title: '🎯 Limit Order',
          description: `Only execute if the price reaches your specified limit. ${orderType === 'BUY' ? 'You\'ll only buy if the price drops to or below your limit' : 'You\'ll only sell if the price rises to or above your limit'}.`,
          icon: '🎯',
          level: 'intermediate'
        },
        {
          title: '⏰ Patience Required',
          description: 'Limit orders may not execute if the price never reaches your limit. Monitor your orders regularly.',
          icon: '⏰',
          level: 'intermediate'
        }
      ];
    }
  };

  const getAssetSpecificGuidance = (): EducationalSection[] => {
    const sections: EducationalSection[] = [];

    if (asset.type === 'STOCK') {
      sections.push({
        title: '📈 Stock Trading',
        description: 'Individual company shares. Research company fundamentals, earnings, and market conditions before trading.',
        icon: '📈',
        level: 'beginner'
      });
    } else if (asset.type === 'ETF') {
      sections.push({
        title: '📊 ETF Trading',
        description: 'Diversified fund tracking an index or sector. Generally less volatile than individual stocks.',
        icon: '📊',
        level: 'beginner'
      });
    } else if (asset.type === 'MUTUAL_FUND') {
      sections.push({
        title: '🏦 Mutual Fund',
        description: 'Professionally managed fund. Typically trades once per day at NAV (Net Asset Value).',
        icon: '🏦',
        level: 'beginner'
      });
    } else if (asset.type === 'BOND') {
      sections.push({
        title: '🏛️ Bond Trading',
        description: 'Fixed-income security. Consider interest rate risk, credit risk, and time to maturity.',
        icon: '🏛️',
        level: 'intermediate'
      });
    }

    // Market State Educational Content
    if (marketState && marketState !== 'REGULAR') {
      sections.push({
        title: '📚 Market Hours & Order Types',
        description: `Market orders are disabled when markets are closed to protect you from stale prices. Use limit orders instead - they let you set your maximum buy price or minimum sell price and only execute when your conditions are met.`,
        icon: '🕒',
        level: 'beginner'
      });
    }

    return sections;
  };

  const getRiskWarnings = (): string[] => {
    const warnings: string[] = [];

    if (orderType === 'BUY') {
      warnings.push('Only invest money you can afford to lose');
      warnings.push('Past performance does not guarantee future results');
      if (tradeType === 'MARKET') {
        warnings.push('Market orders may execute at prices different from the displayed quote');
      }
    } else {
      warnings.push('Selling may result in capital gains or losses for tax purposes');
      warnings.push('Consider the impact on your portfolio diversification');
      if (tradeType === 'MARKET') {
        warnings.push('Market sell orders may execute below the displayed bid price');
      }
    }

    if (marketState !== 'REGULAR') {
      warnings.push('Trading outside regular hours may have higher volatility and wider spreads');
    }

    return warnings;
  };

  const getTradingTips = (): string[] => {
    const tips: string[] = [];

    if (isFirstTime) {
      tips.push('Start with small amounts to gain experience');
      tips.push('Always review your order details before submitting');
      tips.push('Keep records of your trades for learning and tax purposes');
    }

    if (tradeType === 'LIMIT') {
      tips.push('Set realistic limit prices based on recent trading ranges');
      tips.push('Consider setting an expiration date for your limit order');
    }

    if (orderType === 'BUY') {
      tips.push('Consider dollar-cost averaging for long-term investments');
      tips.push('Research the company or fund before investing');
    } else {
      tips.push('Consider tax implications of selling investments');
      tips.push('Review your reasons for selling to ensure they align with your strategy');
    }

    return tips;
  };

  const orderEducation = getOrderTypeEducation();
  const assetEducation = getAssetSpecificGuidance();
  const riskWarnings = getRiskWarnings();
  const tips = getTradingTips();

  return (
    <div className="space-y-4">
      {/* Market Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-lg">{getMarketStateIcon()}</span>
          <span className="font-medium text-blue-800">Market Status:</span>
          <span className="text-blue-700">{getMarketStateMessage()}</span>
        </div>
      </div>

      {/* Educational Content */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Understanding Your Trade</h4>
        
        {/* Order Type Education */}
        <div className="grid gap-2">
          {orderEducation.map((section, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg flex-shrink-0">{section.icon}</span>
                <div>
                  <h5 className="text-sm font-medium text-gray-800">{section.title}</h5>
                  <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Asset-Specific Guidance */}
        {assetEducation.length > 0 && (
          <div className="grid gap-2">
            {assetEducation.map((section, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-lg flex-shrink-0">{section.icon}</span>
                  <div>
                    <h5 className="text-sm font-medium text-gray-800">{section.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Warnings */}
      {showRiskWarnings && riskWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
            ⚠️ Important Considerations
          </h4>
          <ul className="space-y-1">
            {riskWarnings.map((warning, index) => (
              <li key={index} className="text-xs text-yellow-700 flex items-start">
                <span className="text-yellow-600 mr-1 flex-shrink-0">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trading Tips */}
      {tips.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
            💡 Helpful Tips
          </h4>
          <ul className="space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-green-700 flex items-start">
                <span className="text-green-600 mr-1 flex-shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 