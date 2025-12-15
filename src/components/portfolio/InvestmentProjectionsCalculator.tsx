'use client';

import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InvestmentCalculator, type AssetAllocation } from '@/lib/investment-calculator-service';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';

type AssetTypeOption = 'myPortfolio' | 'stocks' | 'bonds' | 'mutualFunds';


export function InvestmentProjectionsCalculator() {
  const { data: portfolioData, loading: portfolioLoading } = usePortfolioOverview();
  
  // Calculator inputs
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [assetType, setAssetType] = useState<AssetTypeOption>('myPortfolio');
  const [showInflation, setShowInflation] = useState(false);

  // Extract portfolio data
  const portfolioValue = portfolioData?.data?.totalPortfolioValue || 0;
  const hasHoldings = (portfolioData?.data?.allocations?.length || 0) > 0;

  // Use portfolio value as initial investment (always)
  const initialInvestment = Math.round(portfolioValue) || 1000;

  // Calculate portfolio allocation
  const portfolioAllocation = useMemo<AssetAllocation>(() => {
    if (!hasHoldings) {
      return { stocks: 100, bonds: 0, etfs: 0, mutualFunds: 0 };
    }

    const holdings = (portfolioData?.data?.allocations || []).map(alloc => ({
      type: alloc.asset.type,
      currentValue: alloc.currentValue
    }));

    return InvestmentCalculator.calculateAllocationFromHoldings(holdings);
  }, [portfolioData, hasHoldings]);

  // Calculate blended return rate for portfolio
  const portfolioReturnRate = useMemo(() => {
    return InvestmentCalculator.calculateBlendedReturnRate(portfolioAllocation);
  }, [portfolioAllocation]);

  // Determine return rate based on selected asset type
  const returnRate = useMemo(() => {
    if (assetType === 'myPortfolio') {
      return portfolioReturnRate;
    }
    
    const rates = {
      stocks: 0.10,
      bonds: 0.05,
      mutualFunds: 0.075
    };
    
    return rates[assetType] || 0.10;
  }, [assetType, portfolioReturnRate]);

  // Calculate results
  const results = useMemo(() => {
    return InvestmentCalculator.calculateFutureValue(
      initialInvestment,
      monthlyContribution,
      returnRate,
      timeHorizon,
      showInflation
    );
  }, [initialInvestment, monthlyContribution, returnRate, timeHorizon, showInflation]);

  // Generate comparison data
  const comparison = useMemo(() => {
    return InvestmentCalculator.generateComparison(
      initialInvestment,
      monthlyContribution,
      timeHorizon
    );
  }, [initialInvestment, monthlyContribution, timeHorizon]);

  // Format chart data for display
  const chartData = results.chartData.map(point => ({
    year: point.year,
    'Your Contributions': point.contributions,
    'Investment Gains': point.gains
  }));

  if (portfolioLoading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-neutral-100 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-32">
      {/* Header */}
      <div className="">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Growth over time</h2>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-prose">
          The longer you invest, the more your money will grow. This calculator will show you how your portfolio could grow over time, based on your current holdings and your monthly contributions.
        </p>

        {/* Portfolio Overview */}
       
      </div>

      <div className="p-6 pt-12 rounded-lg bg-white dark:bg-neutral-800">
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            {/* Monthly Contribution */}
            <div className="flex flex-col gap-4 mr-20">
              <div className="flex-none w-48 mb-8">
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                  Monthly Contribution
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonthlyContribution(Math.max(0, monthlyContribution - 50))}
                    className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 flex items-center justify-center text-neutral-700 dark:text-neutral-200 font-medium transition-colors flex-shrink-0"
                    disabled={monthlyContribution <= 0}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    className="flex-1 text-black dark:text-neutral-100 dark:bg-neutral-700 w-32 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                    step="50"
                  />
                  <button
                    type="button"
                    onClick={() => setMonthlyContribution(monthlyContribution + 50)}
                    className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 flex items-center justify-center text-neutral-700 dark:text-neutral-200 font-medium transition-colors flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Time Horizon */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                  Time Horizon: {timeHorizon} years
                </label>
                <input
                  type="range"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(Number(e.target.value))}
                  min="1"
                  max="50"
                  className="w-full h-2 rounded-lg cursor-pointer accent-black dark:accent-emerald-600 p-2"
                />
                <div className="flex justify-between text-xs text-neutral-800 dark:text-neutral-300 mt-1">
                  <span>1 year</span>
                  <span>25 years</span>
                  <span>50 years</span>
                </div>
              </div>
            </div>

            {/* Asset Type */}
            <div className="mr-20">
              <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                Investment Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {hasHoldings && (
                  <label className="flex flex-col items-center p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                    <input
                      type="radio"
                      name="assetType"
                      value="myPortfolio"
                      checked={assetType === 'myPortfolio'}
                      onChange={() => setAssetType('myPortfolio')}
                      className="accent-emerald-600 mb-2"
                    />
                    <div className="text-center">
                      <div className="font-medium text-black dark:text-neutral-100 mb-1">My Portfolio</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                        {(portfolioReturnRate * 100).toFixed(1)}% return
                      </div>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-transparent text-blue-800 dark:text-blue-400 dark:border dark:border-blue-400 rounded-full">
                        Custom Mix
                      </span>
                    </div>
                  </label>
                )}
                
                <label className="flex flex-col items-center p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                  <input
                    type="radio"
                    name="assetType"
                    value="stocks"
                    checked={assetType === 'stocks'}
                    onChange={() => setAssetType('stocks')}
                    className="accent-emerald-600 mb-2"
                  />
                  <div className="text-center">
                    <div className="font-medium text-black dark:text-neutral-100 mb-1">Stocks</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                      10% return
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 dark:bg-transparent text-red-800 dark:text-red-400 dark:border dark:border-red-400 rounded-full">
                      High Risk
                    </span>
                  </div>
                </label>

                <label className="flex flex-col items-center p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                  <input
                    type="radio"
                    name="assetType"
                    value="mutualFunds"
                    checked={assetType === 'mutualFunds'}
                    onChange={() => setAssetType('mutualFunds')}
                    className="accent-emerald-600 mb-2"
                  />
                  <div className="text-center">
                    <div className="font-medium text-black dark:text-neutral-100 mb-1">Mutual Funds</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                      7.5% return
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-transparent text-yellow-800 dark:text-yellow-400 dark:border dark:border-yellow-400 rounded-full">
                      Medium Risk
                    </span>
                  </div>
                </label>

                <label className="flex flex-col items-center p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                  <input
                    type="radio"
                    name="assetType"
                    value="bonds"
                    checked={assetType === 'bonds'}
                    onChange={() => setAssetType('bonds')}
                    className="accent-emerald-600 mb-2"
                  />
                  <div className="text-center">
                    <div className="font-medium text-black dark:text-neutral-100 mb-1">Bonds</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                      5% return
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 dark:bg-transparent text-green-800 dark:text-green-400 dark:border dark:border-green-400 rounded-full">
                      Low Risk
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInflation}
                  onChange={(e) => setShowInflation(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Adjust for inflation (3% annually)</span>
              </label>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            

            {/* Growth Chart */}
            <div className="">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.3}/>
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => InvestmentCalculator.formatCurrency(value)}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area 
                    type="monotone" 
                    dataKey="Your Contributions" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="url(#colorContributions)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Investment Gains" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="url(#colorGains)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Primary Result */}
            <div className="ml-10">
              <div className="text-sm font-medium text-black dark:text-neutral-200 mb-1">
                Your current portfolio:
              </div>
              <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-300 mb-4">
                {InvestmentCalculator.formatCurrency(portfolioValue || initialInvestment)}
              </div>
              
              <div className="text-sm font-medium text-black dark:text-neutral-200 mb-2">
                After {timeHorizon} {timeHorizon === 1 ? 'year' : 'years'}, you could have:
              </div>
              <div className="text-4xl font-bold text-black dark:text-neutral-100 mb-4">
                {InvestmentCalculator.formatCurrency(results.finalValue)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300">Your contributions:</span>
                  <span className="font-semibold text-green-600">
                    {InvestmentCalculator.formatCurrency(results.totalContributions)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300">Investment gains:</span>
                  <span className="font-semibold text-blue-600">
                    {InvestmentCalculator.formatCurrency(results.totalGains)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-primary-200">
                  <span className="text-neutral-700 dark:text-neutral-300">Total gain:</span>
                  <span className="font-semibold text-black dark:text-neutral-100">
                    {InvestmentCalculator.formatPercent(results.percentageGain)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        

        

        
      </div>
    </div>
  );
}
