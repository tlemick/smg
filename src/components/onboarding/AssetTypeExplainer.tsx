'use client';

import { Icon, InfoIcon } from '@/components/ui';

interface AssetTypeExplainerProps {
  type: 'stock' | 'mutual-fund' | 'bond';
}

const explainers = {
  stock: {
    title: 'What is a Stock?',
    icon: '📈',
    definition:
      'A stock represents ownership in a company. When you buy a stock, you become a shareholder and own a small piece of that business.',
    whyInvest: [
      'Growth potential - stocks can increase significantly in value',
      'Dividends - some companies share profits with shareholders',
      'Ownership - you have a stake in successful companies',
    ],
    considerations: [
      'Higher risk - stock prices can be volatile',
      'Research needed - understand the company before investing',
      'Long-term focus - best results typically come from holding for years',
    ],
  },
  'mutual-fund': {
    title: 'What is a Mutual Fund?',
    icon: '📊',
    definition:
      'A mutual fund pools money from many investors to purchase a diversified portfolio of stocks, bonds, or other securities, professionally managed by experts.',
    whyInvest: [
      'Instant diversification - one purchase gives you many holdings',
      'Professional management - experts make investment decisions',
      'Lower risk - spreading investments reduces impact of any single loss',
    ],
    considerations: [
      'Management fees - funds charge ongoing fees',
      'Less control - managers decide what to buy/sell',
      'Moderate returns - diversification limits both risk and upside',
    ],
  },
  bond: {
    title: 'What is a Bond?',
    icon: '🏦',
    definition:
      'A bond is a loan you make to a government or corporation. They promise to pay you back with interest over a set period of time.',
    whyInvest: [
      'Stable income - bonds pay regular interest payments',
      'Lower volatility - less price fluctuation than stocks',
      'Capital preservation - helps protect your money',
    ],
    considerations: [
      'Lower returns - typically grow slower than stocks',
      'Interest rate risk - bond values change with interest rates',
      'Inflation risk - returns may not keep pace with rising prices',
    ],
  },
};

export function AssetTypeExplainer({ type }: AssetTypeExplainerProps) {
  const explainer = explainers[type];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-purple-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-3xl">{explainer.icon}</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {explainer.title}
          </h3>
          <div className="flex items-center space-x-1 text-sm text-purple-600 dark:text-purple-400">
            <Icon icon={InfoIcon} size="xs" />
            <span>Learn the basics</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Definition */}
        <div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {explainer.definition}
          </p>
        </div>

        {/* Why Invest */}
        <div>
          <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2 flex items-center">
            <span className="mr-2">✅</span>
            Why Invest?
          </h4>
          <ul className="space-y-1">
            {explainer.whyInvest.map((reason, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 pl-4">
                • {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Considerations */}
        <div>
          <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            Things to Consider
          </h4>
          <ul className="space-y-1">
            {explainer.considerations.map((consideration, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 pl-4">
                • {consideration}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

