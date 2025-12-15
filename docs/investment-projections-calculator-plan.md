# Investment Projections Calculator Plan

## Executive Summary

This calculator transforms abstract financial concepts into personal, actionable insights by **integrating directly with each student's actual portfolio**. Instead of a generic "what if" tool, students see projections based on their real holdings—their Apple stock, their Tesla shares, their actual wins and losses. This personal connection makes compound growth, diversification, and long-term investing concepts immediately relevant and motivating.

**Key Differentiators:**
- 🎯 **Portfolio-Aware**: Pre-populated with their current holdings and values
- 📊 **Multiple Modes**: Project whole portfolio or drill into individual positions  
- 📈 **Performance Context**: Shows current gains/losses alongside future potential
- 💡 **Smart Insights**: Educational content adapts to their specific situation
- 🔄 **Action-Oriented**: Direct path from projection to making trades

## Overview
An educational, interactive calculator designed to help teens understand compound growth, regular investing, and the long-term potential of different asset types. The calculator is **tethered to their actual portfolio holdings**, showing how their current investments could grow over time with continued contributions. The goal is to demystify investing and show how small, consistent contributions can grow substantially over time.

## Target Audience
- Teens (13-18) with limited financial literacy
- Students in the Stock Market Game learning about investing
- Need clear explanations without jargon
- Respond well to visual, interactive learning

## Core Educational Goals

1. **Compound Growth Concept**: Show how money grows on itself over time
2. **Power of Consistency**: Demonstrate that regular small contributions matter more than timing
3. **Asset Class Differences**: Teach the risk/return tradeoff across stocks, bonds, and mutual funds
4. **Time as an Advantage**: Show that starting early, even with small amounts, can lead to significant wealth
5. **Realistic Expectations**: Use historically accurate return rates to set proper expectations
6. **Personal Relevance**: Connect projections to their actual portfolio, making it real and actionable

---

## Portfolio Integration

### Why Portfolio Integration Matters

**Personal Connection**
- Teens learn better with **their own data** rather than abstract examples
- Seeing "your Apple stock" vs "a hypothetical $1,000" makes it real
- Creates emotional investment in the learning experience

**Immediate Relevance**
- No need to input values manually - it's pre-populated
- Reduces friction and gets them to insights faster
- Shows immediate connection between actions (trades) and outcomes (projections)

**Educational Power**
- Can show how their **actual wins and losses** could evolve over time
- Teaches patience: "Even though Tesla is down 8%, look at the 10-year potential"
- Demonstrates real portfolio concepts: diversification, dollar-cost averaging, compounding

**Motivation to Act**
- Direct path from projection → trade page → take action
- "I want my portfolio to look like that projection in 10 years"
- Encourages regular investing habits while they're young

**Contextual Insights**
- Educational content adapts to their specific situation
- Heavy in stocks? → Show diversification lesson
- Small portfolio? → Encourage them that starting small is fine
- Losing position? → Teach about long-term thinking

### Data Sources
The calculator pulls from the user's actual holdings:

**Current Portfolio Data:**
- Total portfolio value (current market value of all positions)
- Individual holdings by ticker (AAPL, TSLA, etc.)
- Current position values
- Asset types (stocks, bonds, mutual funds/ETFs)
- Purchase dates and costs (optional: show actual performance so far)

**Integration Points:**
1. **Default Initial Investment**: Pre-populate with current portfolio value
2. **Asset Mix**: Auto-detect asset allocation (% stocks, % bonds, % funds)
3. **Individual Position Projections**: Allow drilling down to see specific holdings
4. **Performance Context**: Show historical performance vs. projected future

### Projection Modes

**Mode 1: Whole Portfolio Projection** (Default)
- Starting value: Current total portfolio value
- Asset type: Weighted average based on current holdings
  - If 70% stocks, 20% bonds, 10% funds → use blended rate
- Shows: "Your current $X portfolio could become $Y"

**Mode 2: Individual Position Projection**
- User selects a specific holding (e.g., "AAPL - 10 shares at $180")
- Shows: "Your 10 shares of Apple (currently worth $1,800) could become..."
- Allows adding: "What if you bought 1 more share each month?"

**Mode 3: New Position Planning**
- User wants to start a new position
- Calculator shows: "If you invest $X in [new asset], it could grow to..."
- Helps them plan their next trade

### UI Elements for Portfolio Integration

**Portfolio Overview Card** (Top of page)
```
Your Current Portfolio
────────────────────────────
Total Value: $12,450
  • Stocks: $8,715 (70%)
  • Bonds: $2,490 (20%)
  • Funds: $1,245 (10%)

[View Whole Portfolio] [Select Individual Position ▼]
```

**Position Selector Dropdown** (When "Individual Position" mode selected)
```
Select a position to project:
├── AAPL - 10 shares ($1,800) - Stock
├── TSLA - 5 shares ($1,250) - Stock  
├── VOO - 15 shares ($6,750) - Fund (S&P 500)
├── BND - 20 shares ($1,600) - Bond Fund
└── GOOGL - 8 shares ($1,050) - Stock
```

**Current Performance Banner** (Contextual)
```
Since you bought AAPL 3 months ago:
📈 +12.5% ($200 gain)

Let's see how it could grow over the next few years...
```

---

## Component Structure

### 1. Calculator Input Section

#### Investment Details
- **Initial Investment** 
  - Input: Dollar amount ($0 - $100,000)
  - **Default: Current portfolio value** (or $1,000 if no holdings)
  - Helper text: "How much are you starting with today?"
  - **Pre-populated with portfolio data**: "Your current portfolio: $12,450"
  - Toggle: "Use my portfolio" vs "Start from scratch"
  
- **Monthly Contribution**
  - Input: Dollar amount ($0 - $10,000)
  - Default: $100
  - Helper text: "How much can you add each month?"
  - Educational tooltip: "Regular investing (called 'dollar-cost averaging') reduces risk and builds wealth steadily"

- **Time Horizon**
  - Slider: 1-50 years
  - Default: 10 years
  - Visual markers at key milestones:
    - 4 years: "High school graduation"
    - 10 years: "After college"
    - 30 years: "Mid-career"
    - 40 years: "Approaching retirement"
  - Helper text: "How long will you let your money grow?"

#### Asset Type Selection
Radio buttons or pill selector with four options:

**My Portfolio Mix** (New - appears if user has holdings)
- Historical average return: Calculated based on actual allocation
- Risk level: Dynamic based on mix
- **Default when "Use my portfolio" is toggled on**
- Shows: "Based on your current 70% stocks, 20% bonds, 10% funds"
- Blended rate calculation displayed: "~8.75% average return"
- Teen-friendly explanation: "This uses your actual portfolio mix to project growth."

**Stocks (Equities)**
- Historical average return: 10% annually
- Risk level: High ⚡⚡⚡
- Volatility: Can swing 20-30% in a year
- Best for: Long-term goals (10+ years)
- Teen-friendly explanation: "When you buy stocks, you own a tiny piece of companies like Apple or Nike. More risk, but historically the highest returns over time."

**Bonds**
- Historical average return: 5% annually
- Risk level: Low ⚡
- Volatility: Typically 3-5% swings
- Best for: Medium-term goals (3-10 years)
- Teen-friendly explanation: "Bonds are like lending money to companies or the government. They pay you interest. Safer than stocks but grow slower."

**Mutual Funds (Balanced)**
- Historical average return: 7.5% annually
- Risk level: Medium ⚡⚡
- Volatility: Moderate, 10-15% swings
- Best for: All goals, good for beginners
- Teen-friendly explanation: "A mix of stocks and bonds bundled together by professionals. Middle ground between safety and growth."

#### Advanced Options (Collapsible)
- **Inflation Adjustment** 
  - Toggle: Show "real" vs "nominal" returns
  - Default: OFF (nominal)
  - Explanation: "Inflation makes money worth less over time (average 3% per year). Toggle this to see your buying power."
  
- **Market Volatility Preview**
  - Toggle: Show realistic ups and downs vs smooth growth
  - Default: OFF (smooth)
  - Explanation: "Markets don't grow smoothly. This shows a more realistic bumpy ride."

---

### 2. Results Visualization Section

#### Primary Result Card
Large, prominent display showing:
```
After 10 years, you could have:
$24,616
```
- Breakdown underneath:
  - Your contributions: $13,000 (green)
  - Investment gains: $11,616 (blue)
  - Percentage gain: +89%

#### Growth Chart
- **Chart Type**: Area chart showing cumulative value over time
- **X-axis**: Years
- **Y-axis**: Portfolio value
- **Visual Elements**:
  - Two stacked areas: Contributions (green) and Gains (blue gradient)
  - Milestone markers with annotations
  - Hover tooltips showing year, total value, contributions, gains
  
- **Interactive Features**:
  - Animate on load (smooth growth from 0 to final value)
  - Highlight contributions vs gains clearly
  - If volatility mode is on, show realistic fluctuations

#### Comparison Table
Side-by-side comparison showing "What if you chose different assets?"

| Asset Type | Final Value | Total Gain | Avg. Annual Return |
|------------|-------------|------------|-------------------|
| Stocks | $26,748 | +106% | 10% |
| Mutual Funds | $24,616 | +89% | 7.5% |
| Bonds | $21,113 | +62% | 5% |
| Savings Account* | $13,650 | +5% | 0.5% |

*Include savings account as a baseline to show why investing matters

---

### 3. Educational Insights Section

#### Dynamic Educational Cards
Based on inputs and portfolio data, show 2-3 relevant insights:

**Portfolio-Specific Insights:**

**When using their actual portfolio:**
> 💼 **Your Portfolio in Action**  
> You currently own [X] different positions worth $[Y]. This projection shows how your actual holdings could grow if the market performs like it has historically. Keep in mind, your actual stocks might do better or worse than these averages.

**When portfolio is heavily weighted to one asset type:**
> ⚖️ **Diversification Matters**  
> Your portfolio is [X]% stocks. While stocks have great long-term potential, spreading your money across different types of investments (stocks, bonds, funds) can reduce risk. Try adjusting the mix to see the difference.

**When they have a winning position:**
> 🎉 **Building on Success**  
> Your [TICKER] position is up [X]%! What if you kept adding to winners like this? This calculator can show you the potential. Just remember: past performance doesn't guarantee future results.

**When they have a losing position:**
> 📚 **Learning from Dips**  
> Your [TICKER] is down [X]% right now. But if you believe in the company long-term, regular investing during dips can lower your average cost. This is called "dollar-cost averaging"—buying more when prices are low.

**When portfolio is small/just starting:**
> 🌱 **Every Journey Starts Small**  
> Your portfolio is currently $[X]. That's a great start! The key is consistency. Adding just $[Y] per month could turn this into $[Z] over time. Small, regular investments compound into something big.

**General Insights:**

**When time horizon > 20 years:**
> 💡 **The Power of Starting Early**  
> Because you're investing for 20+ years, you have time on your side. Even if markets drop 30% tomorrow, history shows they recover. Young investors can take more risk because they have decades to ride out volatility.

**When monthly contribution > 0:**
> 💡 **Dollar-Cost Averaging**  
> By investing $X every month, you buy more shares when prices are low and fewer when prices are high. This automatic strategy removes the stress of "timing the market" and reduces your average cost over time.

**When contribution is low:**
> 💡 **Every Dollar Counts**  
> Think you need thousands to start? Think again. Just $X/month turns into $Y after Z years. The habit of regular investing matters more than the amount. Start small, increase as you earn more.

**When return rate is high (stocks):**
> ⚠️ **Understanding Risk**  
> Stocks have delivered 10% average returns over 100+ years, but any single year could be -30% or +40%. Don't invest money you'll need in the next 5 years. High returns require patience through the ups and downs.

**When showing inflation-adjusted returns:**
> 📊 **Real vs. Nominal Returns**  
> Your $X in 10 years won't buy what $X buys today due to inflation (things getting more expensive). That's why we invest—to grow wealth faster than inflation erodes it.

---

### 4. Scenario Presets

Quick-start buttons for common teen goals:

**"Saving for College"**
- Initial: $2,000
- Monthly: $150
- Years: 4
- Asset: Bonds (lower risk for short term)

**"First Car Fund"**
- Initial: $500
- Monthly: $100
- Years: 3
- Asset: Bonds

**"Long-term Wealth Building"**
- Initial: $1,000
- Monthly: $200
- Years: 30
- Asset: Stocks

**"Emergency Fund"**
- Initial: $0
- Monthly: $50
- Years: 1
- Asset: Bonds

Each preset automatically adjusts all inputs and shows an explanation:
> "For short-term goals like college, bonds are safer because you need the money soon and can't risk a market crash right before tuition is due."

---

## Calculation Methodology

### Formula for Future Value with Regular Contributions

```
FV = P(1 + r)^t + PMT × [((1 + r)^t - 1) / r]

Where:
- FV = Future Value
- P = Initial Principal (initial investment)
- r = Annual interest rate (as decimal, divided by 12 for monthly)
- t = Time in years (months = t × 12)
- PMT = Monthly payment (contribution)
```

### Monthly Compounding
Since contributions are monthly, use monthly compounding:
```
Monthly rate = (1 + annual_rate)^(1/12) - 1
```

### With Inflation Adjustment
```
Real return = ((1 + nominal_rate) / (1 + inflation_rate)) - 1
```
Default inflation rate: 3% annually

### Volatility Simulation (Advanced Mode)
Use a Monte Carlo-style approach:
- Generate random monthly returns based on historical volatility
- Stocks: mean 10%, std dev 15%
- Bonds: mean 5%, std dev 5%
- Mutual funds: mean 7.5%, std dev 10%
- Run simulation and display one realistic path

---

## UI/UX Design Principles

### Visual Design
1. **Color Coding**
   - Contributions: Green (#10b981) - "money you put in"
   - Investment gains: Blue (#3b82f6) - "money your money made"
   - Risk indicators: Yellow/Orange/Red (low/med/high)

2. **Typography**
   - Large, clear numbers for results
   - Sans-serif font (same as existing app)
   - Use size hierarchy: Results > Labels > Helper text

3. **Layout**
   - Two columns on desktop: Inputs (left) | Results (right)
   - Single column on mobile: Inputs → Results
   - Sticky results section on scroll (desktop)

### Interactivity
1. **Real-time Updates**
   - Results update immediately as user changes inputs
   - Smooth transitions, not jarring
   - Debounce calculations by 300ms for performance

2. **Input Validation**
   - Show friendly errors: "Let's start with at least $1"
   - Suggest reasonable ranges based on age/context
   - Don't let users break the calculator

3. **Tooltips & Explanations**
   - (?) icons next to complex terms
   - Hover for definitions
   - Mobile: tap to show in modal

### Educational Tone
- **Friendly, not condescending**: "Let's see how your money can grow" not "You should know..."
- **Use analogies**: "Compound growth is like a snowball rolling downhill"
- **Celebrate small wins**: "Nice! With patience, that could become..."
- **Be honest about risks**: Don't promise returns, show historical averages
- **Empower action**: "You're in control of your financial future"

---

## Technical Implementation

### Component Architecture

```
<InvestmentProjectionsCalculator>
  ├── <PortfolioOverviewCard />          // NEW: Shows current holdings
  ├── <ProjectionModeSelector />         // NEW: Whole portfolio vs individual
  ├── <PositionSelector />               // NEW: Dropdown for individual positions
  ├── <CalculatorInputs>
  │   ├── <PortfolioToggle />            // NEW: "Use my portfolio" toggle
  │   ├── <InvestmentAmountInput />      // Pre-populated with portfolio value
  │   ├── <MonthlyContributionInput />
  │   ├── <TimeHorizonSlider />
  │   ├── <AssetTypeSelector />          // Includes "My Portfolio Mix" option
  │   └── <AdvancedOptions />
  ├── <ScenarioPresets />
  ├── <ResultsSection>
  │   ├── <CurrentPerformanceBanner />   // NEW: Shows actual gains/losses so far
  │   ├── <PrimaryResultCard />
  │   ├── <GrowthChart />
  │   └── <ComparisonTable />
  └── <EducationalInsights>
      └── <DynamicInsightCard />         // Enhanced with portfolio-specific insights
```

### State Management

```typescript
interface PortfolioData {
  totalValue: number;
  positions: Array<{
    ticker: string;
    shares: number;
    currentPrice: number;
    currentValue: number;
    costBasis: number;
    gainLoss: number;
    gainLossPercent: number;
    assetType: 'stock' | 'bond' | 'mutualFund' | 'etf';
    purchaseDate: Date;
  }>;
  allocation: {
    stocks: number;      // percentage
    bonds: number;       // percentage
    mutualFunds: number; // percentage
  };
  blendedReturnRate: number; // Weighted average expected return
}

interface CalculatorState {
  // Portfolio integration
  usePortfolioData: boolean;
  projectionMode: 'wholePortfolio' | 'individualPosition' | 'newPosition';
  selectedPosition?: string; // ticker symbol
  
  // Calculator inputs
  initialInvestment: number;
  monthlyContribution: number;
  timeHorizon: number;
  assetType: 'myPortfolio' | 'stocks' | 'bonds' | 'mutualFunds';
  showInflationAdjusted: boolean;
  showVolatility: boolean;
}

interface CalculatorResults {
  finalValue: number;
  totalContributions: number;
  totalGains: number;
  percentageGain: number;
  
  // Portfolio-specific results
  currentPerformance?: {
    timeHeld: string; // "3 months", "1 year"
    gainLoss: number;
    gainLossPercent: number;
  };
  
  chartData: Array<{
    year: number;
    contributions: number;
    gains: number;
    total: number;
  }>;
  
  comparison: Array<{
    assetType: string;
    finalValue: number;
    gain: number;
    avgReturn: number;
  }>;
}
```

### Calculation Service

Create `/src/lib/investment-calculator-service.ts`:

```typescript
export class InvestmentCalculator {
  static calculateFutureValue(
    principal: number,
    monthlyContribution: number,
    annualRate: number,
    years: number,
    adjustForInflation: boolean = false,
    inflationRate: number = 0.03
  ): CalculatorResults {
    // Implementation
  }
  
  static getHistoricalReturns(assetType: AssetType): {
    mean: number;
    stdDev: number;
    description: string;
  } {
    // Return historical data
  }
  
  static simulateVolatility(
    principal: number,
    monthlyContribution: number,
    annualRate: number,
    volatility: number,
    years: number
  ): Array<MonthlyValue> {
    // Monte Carlo simulation
  }
  
  // NEW: Portfolio-specific calculations
  static calculateBlendedReturnRate(allocation: {
    stocks: number;
    bonds: number;
    mutualFunds: number;
  }): number {
    const rates = {
      stocks: 0.10,
      bonds: 0.05,
      mutualFunds: 0.075
    };
    
    return (
      (allocation.stocks / 100) * rates.stocks +
      (allocation.bonds / 100) * rates.bonds +
      (allocation.mutualFunds / 100) * rates.mutualFunds
    );
  }
  
  static calculatePortfolioAllocation(
    positions: Array<PortfolioPosition>
  ): { stocks: number; bonds: number; mutualFunds: number } {
    const total = positions.reduce((sum, p) => sum + p.currentValue, 0);
    
    const allocation = { stocks: 0, bonds: 0, mutualFunds: 0 };
    
    positions.forEach(pos => {
      const weight = (pos.currentValue / total) * 100;
      if (pos.assetType === 'stock') allocation.stocks += weight;
      else if (pos.assetType === 'bond') allocation.bonds += weight;
      else allocation.mutualFunds += weight;
    });
    
    return allocation;
  }
  
  static calculateCurrentPerformance(position: PortfolioPosition): {
    timeHeld: string;
    gainLoss: number;
    gainLossPercent: number;
  } {
    const now = new Date();
    const purchased = new Date(position.purchaseDate);
    const monthsHeld = Math.floor(
      (now.getTime() - purchased.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    const timeHeld = monthsHeld < 12 
      ? `${monthsHeld} month${monthsHeld !== 1 ? 's' : ''}`
      : `${Math.floor(monthsHeld / 12)} year${Math.floor(monthsHeld / 12) !== 1 ? 's' : ''}`;
    
    return {
      timeHeld,
      gainLoss: position.gainLoss,
      gainLossPercent: position.gainLossPercent
    };
  }
  
  static classifyAssetType(ticker: string): 'stock' | 'bond' | 'mutualFund' | 'etf' {
    // Simple heuristics - could be enhanced with API lookup
    const bondIndicators = ['BND', 'AGG', 'TLT', 'IEF', 'SHY'];
    const fundIndicators = ['VOO', 'SPY', 'QQQ', 'VTI', 'IWM'];
    
    if (bondIndicators.includes(ticker.toUpperCase())) return 'bond';
    if (fundIndicators.includes(ticker.toUpperCase())) return 'etf';
    
    // Default to stock for most tickers
    return 'stock';
  }
}
```

### Chart Library
- Use **Recharts** (already in ecosystem)
- AreaChart for stacked contributions vs gains
- Smooth animations with `isAnimationActive`
- Custom tooltips for educational context

### Dependencies
No new dependencies needed:
- Recharts: Already in project
- React state: Built-in
- Tailwind: Already styled

### API Integration

**Endpoint needed: `/api/user/portfolio-overview`**

This should return portfolio data for the calculator:

```typescript
// GET /api/user/portfolio-overview
{
  totalValue: 12450.00,
  cashBalance: 87550.00,
  positions: [
    {
      ticker: "AAPL",
      companyName: "Apple Inc.",
      shares: 10,
      currentPrice: 180.00,
      currentValue: 1800.00,
      costBasis: 1600.00,
      gainLoss: 200.00,
      gainLossPercent: 12.5,
      assetType: "stock",
      purchaseDate: "2025-06-30T00:00:00Z"
    },
    // ... more positions
  ],
  allocation: {
    stocks: 70,
    bonds: 20,
    mutualFunds: 10
  }
}
```

**Alternative: Reuse existing portfolio API**
If there's already a portfolio endpoint, we can transform that data on the frontend. Check `/api/user/portfolio` or similar.

---

## Content & Copy

### Main Heading
"See Your Money Grow Over Time"

### Subheading
"Understand how compound growth and regular investing can build wealth—even starting small."

### CTA After Calculation
"Ready to start for real? Try placing a trade with your virtual portfolio."
[Button: Go to Trade Page]

### Empty State (Before Calculation)
"Adjust the settings above to see how your money could grow. There's no right answer—experiment and learn!"

### Error States
- No initial investment or contribution: "Add an initial investment or monthly contribution to see projections."
- Time horizon too short: "Pick at least 1 year to see meaningful growth."

---

## Progressive Enhancement Ideas

### Phase 1 (MVP)
- Basic calculator with three asset types
- Single growth chart
- Primary result card
- 2-3 static educational insights

### Phase 2 (Enhanced)
- Inflation toggle
- Comparison table
- Scenario presets
- Dynamic educational insights based on inputs

### Phase 3 (Advanced)
- Volatility simulation
- Historical backtesting ("What if you started investing in 2010?")
- Goal-based planning ("How much per month to reach $X by year Y?")
- Share results (screenshot or link)

### Phase 4 (Gamification)
- Achievement badges ("Planned your first $1M")
- Compare with peers (anonymous)
- "Challenge: Can you beat inflation?"
- Integration with actual portfolio performance

---

## Accessibility Considerations

1. **Keyboard Navigation**
   - All inputs accessible via tab
   - Slider can be adjusted with arrow keys
   - Clear focus indicators

2. **Screen Readers**
   - ARIA labels for all interactive elements
   - Announce when results update
   - Describe chart data in text format below

3. **Color Blindness**
   - Don't rely solely on color for information
   - Use patterns/textures in charts
   - Labels on everything

4. **Reading Level**
   - Keep explanations at 6th-8th grade level
   - Define all financial terms
   - Short sentences, active voice

---

## Success Metrics

### Engagement
- Time spent on calculator page
- Number of calculations run per session
- Use of scenario presets
- Toggling advanced options

### Educational Impact
- Survey: "I understand compound growth better" (before/after)
- Survey: "I know the difference between stocks and bonds"
- Correlation with improved trading decisions in game

### Conversion
- Click-through to trade page after using calculator
- Increased portfolio diversity (trying different asset types)
- Return visits to calculator

---

## Mobile Considerations

### Input Optimization
- Number inputs use native keyboard (type="number")
- Slider has large touch target (min 44px)
- Asset type pills are thumb-sized

### Layout Adjustments
- Stack all elements vertically
- Make chart full-width, scrollable horizontally if needed
- Collapse comparison table to cards
- Scenario presets in horizontal scroll

### Performance
- Debounce calculations on slower devices
- Lazy load chart until scrolled into view
- Optimize chart render with React.memo

---

## Example User Flow

### Scenario 1: Sarah, Age 16 (Has existing portfolio)

1. **Lands on page** → Sees her portfolio overview: "$12,450 across 5 positions"
2. **Sees pre-populated calculator** → "Your current portfolio: $12,450"
3. **Sees projection** → "With no additional contributions, this could grow to $20,123 in 10 years"
4. **Reads insight** → "You currently own 5 different positions worth $12,450..."
5. **Adjusts monthly contribution** → Adds $100/month
6. **Sees updated result** → "Now you could have $34,782 in 10 years!"
7. **Clicks "Select Individual Position"** → Dropdown shows her 5 holdings
8. **Selects "AAPL"** → "Your 10 shares of Apple (currently $1,800)"
9. **Sees performance banner** → "Since you bought AAPL 3 months ago: +12.5% ($200 gain)"
10. **Sees projection** → "If you add 1 share/month, your Apple position could grow to $28,540 in 10 years"
11. **Mind blown** → "I should keep adding to my winners!"
12. **Toggles back to whole portfolio** → Experiments with different monthly amounts
13. **Reads diversification insight** → "Your portfolio is 70% stocks. Try mixing in bonds..."
14. **Clicks CTA** → Goes to trade page to buy more shares

### Scenario 2: Marcus, Age 15 (Just starting out)

1. **Lands on page** → Portfolio shows: "$500 - just getting started!"
2. **Sees small portfolio insight** → "Your portfolio is currently $500. That's a great start!"
3. **Reads preset scenarios** → Clicks "Long-term Wealth Building"
4. **Calculator adjusts** → Initial: $500, Monthly: $200, 30 years, Stocks
5. **Sees result** → "You could have $452,067 in 30 years!"
6. **Breakdown shows** → Contributions: $72,500 | Gains: $379,567
7. **Reads "Power of Starting Early" insight** → Gets motivated
8. **Adjusts to realistic amount** → Changes monthly to $50
9. **Still impressive** → "You could have $113,017"
10. **Experiments with time** → Slides to 40 years
11. **Sees** → "$50/month for 40 years = $267,000!"
12. **Takes screenshot** → Shares with parents
13. **Goes to dashboard** → Ready to commit to regular investing

### Scenario 3: Jamal, Age 17 (Has a losing position)

1. **Lands on page** → Sees portfolio: $3,200
2. **Selects individual position** → Picks "TSLA" 
3. **Sees performance** → "Since you bought TSLA 2 months ago: -8.5% ($185 loss)"
4. **Reads insight** → "Your TSLA is down 8.5% right now. But if you believe in the company..."
5. **Learns about dollar-cost averaging** → "Buying during dips lowers your average cost"
6. **Adjusts to add 1 share/month** → Even though it's down
7. **Sees projection** → "Could recover and grow to $15,340 in 10 years"
8. **Feels better about the loss** → "Okay, this is a long-term play"
9. **Compares** → What if I sold TSLA and bought bonds instead?
10. **Sees lower but safer projection** → Understands risk/reward tradeoff
11. **Decides to hold** → Believes in Tesla long-term
12. **Bookmarks page** → Will check back monthly to stay motivated

---

## Questions for Stakeholders

1. ✅ **Confirmed**: Show actual portfolio holdings and integrate with projections
2. Do we want users to be able to save/name different scenarios for comparison later?
3. Should there be integration with game sessions (e.g., "Try to beat this projection" challenges)?
4. Any compliance concerns with showing projected returns? (Disclaimer needed?) - **Added disclaimer**
5. Should we gamify this with achievements or challenges? ("Projected your first $100K!")
6. **NEW**: Should individual position projections allow "buying more shares" with specific $ amounts or only whole shares?
7. **NEW**: Do we want to show industry/sector allocation alongside asset type allocation?
8. **NEW**: Should we enable "comparing" multiple scenarios side-by-side (e.g., whole portfolio vs picking a specific stock)?
9. **NEW**: Allow exporting/sharing projections with peers or teachers?

---

## Next Steps

### Phase 1: MVP with Portfolio Integration
1. Review and approve this plan
2. **Check existing portfolio APIs** - See if we can reuse `/api/user/portfolio` or need new endpoint
3. Create mockups/wireframes for UI (with portfolio overview card)
4. Build calculation service with portfolio-aware methods
   - Basic future value calculations
   - Blended return rate calculator
   - Portfolio allocation calculator
5. Implement core components:
   - Portfolio overview card
   - Calculator inputs (with pre-population)
   - Results display with chart
   - 2-3 dynamic educational insights
6. Unit tests for calculation service
7. Integration with actual user portfolio data

### Phase 2: Enhanced Features
1. Add projection modes (whole portfolio vs individual positions)
2. Implement position selector dropdown
3. Add current performance banners
4. Scenario presets (adjusted for portfolio context)
5. Inflation toggle
6. Comparison table
7. More educational insights

### Phase 3: Advanced & Polish
1. Volatility simulation
2. Historical backtesting
3. Goal-based planning (reverse calculator)
4. Mobile optimization
5. Accessibility audit
6. User testing with teens
7. Iterate based on feedback

### Phase 4: Gamification (Optional)
1. Achievement system
2. Peer comparison (anonymous)
3. Game session challenges
4. Share/export features

---

## Legal/Compliance Disclaimer

Include at bottom of calculator:

> **Educational Purposes Only**: This calculator uses historical average returns and is for educational purposes only. Past performance does not guarantee future results. Actual investment returns will vary and may be higher or lower than shown. The Stock Market Game is a simulation—always consult a financial advisor before making real investment decisions.
