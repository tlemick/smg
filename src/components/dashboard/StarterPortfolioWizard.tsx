'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CashManagementService } from '@/lib/cash-management-service';
import { MarketStateService } from '@/lib/market-state-service';

interface StarterPortfolioWizardProps {
  userId: string;
  isFirstTime?: boolean;
}

interface CashSummary {
  currentCash: number;
  startingCash: number;
  totalSpent: number;
  availableForTrading: number;
  cashUtilization: number;
}

export default function StarterPortfolioWizard({ userId, isFirstTime = true }: StarterPortfolioWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const steps = [
    {
      title: "Welcome to SMG Trading!",
      type: "introduction",
    },
    {
      title: "Your Starting Capital",
      type: "cash-overview",
    },
    {
      title: "Market Hours & Trading",
      type: "market-education",
    },
    {
      title: "Making Your First Trade",
      type: "trading-guide",
    },
    {
      title: "Ready to Start!",
      type: "completion",
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [summary, market] = await Promise.all([
          CashManagementService.getCashSummary(userId),
          MarketStateService.getMarketStateWithEducation(),
        ]);
        
        setCashSummary(summary);
        setMarketStatus(market);
      } catch (error) {
        console.error('Failed to load wizard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeWizard = () => {
    // Navigate to trading page to make first trade
    router.push('/trade');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {currentStepData.title}
        </h2>

        {currentStepData.type === 'introduction' && (
          <div className="space-y-4">
            <p className="text-gray-700 text-lg">
              Welcome to the SMG Trading Platform! This educational trading simulator will help you learn about:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Buying and selling stocks, bonds, and mutual funds
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Understanding market hours and order types
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Managing your portfolio and analyzing performance
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Learning about trading fees and market dynamics
              </li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-800 font-medium">
                💡 This is a safe learning environment using virtual money. Perfect your skills here!
              </p>
            </div>
          </div>
        )}

        {currentStepData.type === 'cash-overview' && cashSummary && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-800 mb-3">
                💰 Your Trading Capital
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-600">Starting Amount</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${cashSummary.startingCash.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Available to Trade</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${cashSummary.availableForTrading.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">What you need to know about your starting capital:</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
                  <span>You start with <strong>${cashSummary.startingCash.toLocaleString()}</strong> in virtual cash</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
                  <span>This cash is automatically added to your portfolio when you first log in</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
                  <span>You can buy fractional shares, so even expensive stocks are accessible</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
                  <span>Unused cash earns no interest - it's designed to encourage learning through trading</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {currentStepData.type === 'market-education' && marketStatus && (
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${
              marketStatus.isOpen 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">
                Current Market Status: 
                <span className={`ml-2 ${marketStatus.isOpen ? 'text-green-800' : 'text-yellow-800'}`}>
                  {marketStatus.isOpen ? '🟢 OPEN' : '🟡 CLOSED'}
                </span>
              </h3>
              <p className={marketStatus.isOpen ? 'text-green-700' : 'text-yellow-700'}>
                {marketStatus.message}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📚 Educational Note:</h4>
              <p className="text-blue-800 text-sm whitespace-pre-line">
                {marketStatus.educationalNote}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Trading Hours (NYSE/NASDAQ):</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span><strong>Regular Hours:</strong> 9:30 AM - 4:00 PM ET (Monday-Friday)</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span><strong>Pre-Market:</strong> 4:00 AM - 9:30 AM ET</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span><strong>After-Hours:</strong> 4:00 PM - 8:00 PM ET</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {currentStepData.type === 'trading-guide' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">🛒 Buying Securities</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Search for any stock, bond, or fund</li>
                  <li>• Choose shares or dollar amount</li>
                  <li>• Review costs and fees</li>
                  <li>• Confirm your order</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">💰 Selling Securities</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Select from your holdings</li>
                  <li>• Choose how many to sell</li>
                  <li>• Review proceeds after fees</li>
                  <li>• Confirm your sale</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚡ Quick Start Tips:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Start with companies you know (Apple, Microsoft, Google)</li>
                <li>• Try buying fractional shares to diversify with less money</li>
                <li>• Use the search bar to explore different asset types</li>
                <li>• Check your portfolio regularly to track performance</li>
                <li>• Don't be afraid to experiment - this is virtual money!</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Suggested First Trades:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-medium">AAPL</div>
                  <div className="text-blue-600">Apple Inc.</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-medium">SPY</div>
                  <div className="text-blue-600">S&P 500 ETF</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-medium">MSFT</div>
                  <div className="text-blue-600">Microsoft</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStepData.type === 'completion' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-lg text-gray-700">
              Congratulations! You're ready to start your trading journey.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">What's Next:</h4>
              <ul className="text-green-700 space-y-1">
                <li>• Head to the Trading page to make your first order</li>
                <li>• Explore different asset types and sectors</li>
                <li>• Monitor your portfolio performance</li>
                <li>• Learn from each trade you make</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                💡 <strong>Remember:</strong> This is a learning environment. Take risks, make mistakes, 
                and discover what works. Your instructor can reset your portfolio anytime!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`px-4 py-2 rounded-lg font-medium ${
            currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={completeWizard}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Start Trading! 🚀
          </button>
        )}
      </div>
    </div>
  );
} 