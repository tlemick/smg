# Dashboard Activity Feed Implementation Plan - Phase 1

## Executive Summary

This document outlines the implementation of a **Dashboard Activity Feed** component focused on **Trading Activity** and **Portfolio Activity** tracking. The feed will provide students with real-time visibility into successful trades and portfolio changes, serving as both an activity log and engagement tool. This Phase 1 implementation establishes the foundation for future educational and market activity features.

## Current Infrastructure Analysis

### ✅ **EXISTING Infrastructure (Excellent Foundation)**

#### Database Models (95% Complete)
- **Transaction Model**: Complete record of all buy/sell/cash movements
- **Order Model**: Completed market orders with timestamps
- **LimitOrder Model**: Pending/executed/cancelled limit orders with status tracking
- **Holding Model**: Portfolio position changes over time
- **Portfolio Model**: Cash balance changes and portfolio composition
- **Watchlist Models**: Asset addition/removal tracking
- **User Authentication**: Session-based auth for personalized feeds

#### Trading System Integration [[memory:2499476]]
- **Market Order API**: Immediate execution notifications
- **Limit Order API**: Order placement and execution tracking
- **Order Management**: Cancellation and expiration handling
- **Market State Detection**: Market hours awareness for order queuing
- **Educational Features**: Risk warnings and guidance integration

#### Data Infrastructure (90% Complete)
- **Yahoo Finance Integration**: Real-time price updates
- **Asset Quote Cache**: Market state and price change detection
- **Portfolio Calculation**: Value changes and P&L tracking
- **Watchlist System**: Asset monitoring capabilities

### ❌ **MISSING Infrastructure (Need to Build)**

#### Activity Feed Data Model
- **UserActivity** model to track and categorize all user actions
- Activity aggregation and filtering logic
- Real-time activity generation triggers
- Activity priority and importance scoring

#### Activity Feed Component
- **DashboardActivityFeed.tsx** - Main feed display component
- Activity item rendering with contextual information
- Infinite scroll for historical activity
- Filter and search capabilities

#### Real-time Updates System
- WebSocket or polling for live activity updates
- Activity notification delivery
- Cross-tab synchronization for active sessions

#### Educational Activity Tracking
- Achievement and milestone detection
- First-time action recognition
- Progress tracking integration

## Phase 1 Activity Categories

### 1. **Trading Activity** (Core Implementation)

#### Successful Market Orders
```typescript
// Activity examples - successful executions only:
"✅ Bought 10 shares of AAPL at $150.25 for $1,502.50"
"📈 Sold 5 shares of MSFT at $325.80 for $1,629.00"
"🔄 Market order for TSLA queued until market opens at 9:30 AM ET"
"✅ Queued order executed: Bought 25 shares of GOOGL at $125.40"
```

#### Limit Orders Lifecycle
```typescript
// Activity examples - order state changes:
"⏳ Limit order placed: Buy 10 AAPL at $145.00 (Good until cancelled)"
"🎯 Limit order executed: Bought 8 shares of NVDA at $220.00"
"❌ Limit order cancelled: Sell 15 AMZN at $135.00"
"⏰ Limit order expired: Buy 20 META at $180.00"
"📝 Limit order partially filled: 5 of 10 TSLA shares at $180.00"
```

**Note**: Order failures and validation errors will be handled immediately in the trading interface, not as delayed activity feed items.

### 2. **Portfolio Activity** (Core Implementation)

#### Value Changes & Milestones
```typescript
// Activity examples:
"🎉 Portfolio reached $105,000 (+5% from starting balance)"
"📊 Total portfolio value: $98,750 (-1.25% today)"
"💰 Cash balance increased to $15,250 after MSFT sale"
"🎯 Portfolio allocation updated: 45% AAPL, 30% MSFT, 25% Cash"
"⭐ Congratulations! You've reached $110K portfolio value!"
```

#### Position Changes
```typescript
// Activity examples:
"📈 AAPL position increased to 75 shares (avg cost: $148.50)"
"📉 Completely exited TSLA position - sold all 25 shares"
"🔄 Rebalanced: Reduced MSFT from 40% to 25% of portfolio"
"💎 Now holding 15 different assets - well diversified!"
```

#### Profit & Loss Updates
```typescript
// Activity examples:
"💚 AAPL holding up +$1,250 (+8.3%) since purchase"
"❤️ MSFT holding down -$750 (-4.2%) - remember, invest for the long term!"
"📊 Daily P&L: +$125 (+0.12%) - beating S&P 500 today!"
"🎯 Total unrealized gains: +$3,450 (+3.45%)"
```

## Future Phase Activity Categories

### Phase 2: **Market & Watchlist Activity**
- Price alerts and significant movements for watchlist items
- Market hours notifications (open/close)
- Pre-market and after-hours activity updates
- Performance comparisons to market benchmarks

### Phase 3: **Educational Activity**
- Achievement system and learning milestones
- Context-aware educational tips and suggestions
- Risk warnings and portfolio improvement guidance
- Progress tracking and learning streaks

### Phase 4: **Social & Competitive Activity**
- Class rankings and peer comparisons
- Game session updates and announcements
- Competitive challenges and leaderboards
- Collaborative learning features

## Technical Requirements

### 1. Activity Data Model

```typescript
// Add to schema.prisma
model UserActivity {
  id          String   @id @default(cuid())
  userId      String   // Foreign key to User
  type        String   // Activity category (TRADE, PORTFOLIO, MARKET, EDUCATION, SYSTEM)
  subtype     String   // Specific activity (ORDER_EXECUTED, LIMIT_PLACED, MILESTONE_REACHED, etc.)
  title       String   // Human-readable activity title
  description String?  // Detailed description with educational context
  data        Json?    // Structured data (order details, asset info, amounts, etc.)
  importance  Int      @default(1) // 1=Low, 2=Medium, 3=High (affects display prominence)
  relatedAssetId Int?  // Optional link to related asset
  relatedOrderId String? // Optional link to related order
  relatedTransactionId String? // Optional link to related transaction
  icon        String?  // Icon identifier for UI display
  color       String?  // Color theme for activity (success, warning, error, info)
  actionUrl   String?  // Optional deep link for follow-up actions
  read        Boolean  @default(false) // Track if user has seen this activity
  createdAt   DateTime @default(now())
  expiresAt   DateTime? // Optional expiration for temporary activities
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  relatedAsset Asset?  @relation(fields: [relatedAssetId], references: [id])
  
  @@index([userId, createdAt])
  @@index([userId, type])
  @@index([userId, read])
  @@index([importance])
}
```

### 2. Activity Generation Service (Phase 1)

```typescript
// src/lib/activity-service.ts
export class ActivityService {
  // Trading Activities
  static async createMarketOrderExecutedActivity(userId: string, order: Order, transaction: Transaction)
  static async createMarketOrderQueuedActivity(userId: string, orderData: any)
  static async createLimitOrderPlacedActivity(userId: string, limitOrder: LimitOrder)
  static async createLimitOrderExecutedActivity(userId: string, limitOrder: LimitOrder, transaction: Transaction)
  static async createLimitOrderCancelledActivity(userId: string, limitOrder: LimitOrder, reason: string)
  static async createLimitOrderExpiredActivity(userId: string, limitOrder: LimitOrder)
  
  // Portfolio Activities
  static async createPortfolioValueMilestoneActivity(userId: string, portfolioId: string, value: number, milestone: string)
  static async createPositionChangeActivity(userId: string, holding: Holding, change: 'INCREASED' | 'DECREASED' | 'EXITED', previousQuantity?: number)
  static async createDailyPnLActivity(userId: string, portfolioId: string, pnl: number, percentage: number)
  static async createCashBalanceChangeActivity(userId: string, portfolioId: string, newBalance: number, change: number)
  
  // Utility Methods
  static async getRecentActivities(userId: string, limit?: number, categories?: string[])
  static async markActivitiesAsRead(userId: string, activityIds: string[])
  static async cleanupOldActivities(olderThanDays: number)
}
```

### 3. Dashboard Activity Feed Component

```typescript
// src/components/dashboard/ActivityFeed.tsx
interface ActivityFeedProps {
  className?: string;
  maxItems?: number; // Default: 20
  categories?: ActivityCategory[]; // Filter by categories
  showFilters?: boolean; // Default: true
}

export function ActivityFeed({ 
  className, 
  maxItems = 20, 
  categories,
  showFilters = true 
}: ActivityFeedProps) {
  // Component implementation
}

// Activity item component
interface ActivityItemProps {
  activity: UserActivity;
  onMarkRead?: (id: string) => void;
  onAction?: (actionUrl: string) => void;
}

export function ActivityItem({ activity, onMarkRead, onAction }: ActivityItemProps) {
  // Individual activity rendering
}
```

### 4. Real-time Updates Hook

```typescript
// src/hooks/useActivityFeed.ts
export function useActivityFeed(options: {
  userId: string;
  categories?: ActivityCategory[];
  limit?: number;
  realTime?: boolean;
}) {
  // Custom hook for activity data management
  // Handles pagination, real-time updates, filtering
}
```

## Phase 1 Implementation Plan

### **Step 1: Core Infrastructure (Week 1)**

#### 1.1 Database Schema Extension
- Add `UserActivity` model to schema.prisma
- Create migration for activity table
- Add indexes for optimal query performance
- Update User model to include activity relation

#### 1.2 Activity Service Foundation
```typescript
// Core activity creation and management - Phase 1 scope only
- ActivityService class with trading and portfolio activity methods
- Activity categorization for TRADE and PORTFOLIO types
- Database operations for activity CRUD
- Activity cleanup for old entries
```

#### 1.3 API Endpoints
```typescript
// src/app/api/user/activity/route.ts
GET /api/user/activity - Fetch user activities with pagination/filtering
POST /api/user/activity/mark-read - Mark activities as read
```

**Deliverables:**
- Database schema updated
- Core activity service implemented
- Basic API endpoints created
- Activity creation framework ready

---

### **Step 2: Trading & Portfolio Activity Integration (Week 2)**

#### 2.1 Trading Activity Integration
- Integrate with existing market order API [[memory:2499476]]
- Generate activities on successful order execution
- Track market order queuing when market closed
- Integrate with limit order lifecycle tracking

#### 2.2 Portfolio Activity Integration
- Auto-generate activities from transaction records
- Portfolio value milestone detection ($105K, $110K, etc.)
- Position change notifications (new holdings, exits)
- Cash balance update activities after trades

#### 2.3 Activity Triggers
```typescript
// Integration points with existing trading system:
- Hook into market order execution in /api/trade/market-order
- Hook into limit order state changes in /api/trade/limit-order
- Hook into transaction creation for portfolio updates
- Hook into holding updates for position changes
```

**Deliverables:**
- Trading activities automatically generated
- Portfolio activities automatically generated
- Seamless integration with existing trade APIs
- Real-time activity creation on trade events

---

### **Step 3: Activity Feed UI & Dashboard Integration (Week 3)**

#### 3.1 Core Feed Component
```typescript
// src/components/dashboard/ActivityFeed.tsx - Main container
// src/components/dashboard/ActivityItem.tsx - Individual activity renderer
// src/hooks/useActivityFeed.ts - Data fetching and state management
```

#### 3.2 Visual Design System
- Activity card design with icons and colors for trade/portfolio events
- Typography hierarchy for readability
- Responsive design for mobile/desktop
- Loading states and empty state handling

#### 3.3 Essential Features
- Chronological activity display (newest first)
- Basic filtering by activity type (Trading vs Portfolio)
- Deep linking to related asset pages
- Mark as read functionality

#### 3.4 Dashboard Integration
- Add ActivityFeed to dashboard page as new section
- Proper spacing and layout integration with existing sections
- Section header with activity count and "View All" link

**Deliverables:**
- Complete ActivityFeed component implemented
- Visual design matching existing dashboard
- Dashboard integration complete
- Basic filtering and interaction features

## Phase 1 Integration Points

### Trading System Integration [[memory:2499476]]
- **Market Order API Integration**: Hook into `/api/trade/market-order` for execution activities
- **Limit Order API Integration**: Hook into `/api/trade/limit-order` for order lifecycle tracking
- **Order Management**: Integrate with existing order state changes and cancellations
- **Market State Awareness**: Use existing market hours detection for order queuing activities

### Portfolio System Integration
- **Transaction Recording**: Generate activities from successful transaction creation
- **Holding Updates**: Detect position changes when holdings are modified
- **Cash Balance Changes**: Track cash movements from trading activities
- **Portfolio Value Calculation**: Trigger milestone activities based on total portfolio value

### Dashboard Integration
- **Consistent Design**: Match existing dashboard component styling and layout patterns
- **Navigation**: Deep links to asset detail pages and trading interfaces
- **State Management**: Coordinate with existing dashboard data fetching patterns
- **Mobile Responsiveness**: Consistent with existing dashboard mobile design

## Phase 1 User Experience Considerations

### Activity Display Principles
- **Clear Action Descriptions**: Every activity clearly describes what happened
- **Visual Hierarchy**: Trading activities and significant portfolio changes prominently displayed
- **Chronological Organization**: Most recent activities shown first
- **Consistent Iconography**: Recognizable icons for buy/sell/portfolio events

### Information Architecture
- **Activity Categorization**: Clear distinction between Trading and Portfolio activities
- **Contextual Details**: Include relevant amounts, quantities, and prices
- **Asset Links**: Direct navigation to asset detail pages
- **Time Stamps**: Clear indication of when activities occurred

### Accessibility & Usability
- **Screen Reader Support**: ARIA labels and semantic markup for all activity items
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Color Accessibility**: WCAG compliant color contrasts for success/change indicators
- **Mobile Optimization**: Touch-friendly interface optimized for mobile trading

## Performance & Scalability

### Database Optimization
- **Efficient Indexing**: Optimized queries for activity retrieval
- **Activity Cleanup**: Automatic pruning of old activities
- **Batch Operations**: Efficient bulk activity creation
- **Query Optimization**: Minimize database load

### Real-time Performance
- **WebSocket Efficiency**: Minimal bandwidth usage
- **Update Batching**: Group rapid-fire updates
- **Client-side Caching**: Reduce redundant requests
- **Background Processing**: Non-blocking activity generation

### Storage Management
- **Activity Retention**: Configurable activity history limits
- **Data Compression**: Efficient storage of activity data
- **Archive System**: Long-term storage for historical analysis
- **Cleanup Automation**: Scheduled cleanup of expired activities

## Security & Privacy

### Data Protection
- **User Isolation**: Activities only visible to owning user
- **Sensitive Data**: No exposure of sensitive financial information
- **Activity Permissions**: Role-based activity visibility
- **Data Validation**: Sanitize all activity content

### Privacy Considerations
- **Opt-out Options**: User control over activity types
- **Data Retention**: Clear policies for activity data
- **Educational Compliance**: FERPA compliance for student data
- **Anonymous Analytics**: Non-identifying usage statistics

## Phase 1 Success Metrics

### Engagement Metrics
- **Activity Generation Rate**: Activities created per trading action (target: 100%)
- **Activity View Rate**: Percentage of generated activities viewed by users
- **Click-through Rate**: Users clicking from activities to asset pages
- **Dashboard Integration**: Activity feed usage vs other dashboard sections

### Technical Performance
- **Load Time**: Activity feed rendering performance (target: < 2 seconds)
- **Activity Creation Latency**: Time from trade execution to activity creation (target: < 1 second)
- **Database Performance**: Query execution times for activity retrieval
- **Integration Success**: Zero missed activity generation for successful trades

## Future Enhancements

### Advanced Features
- **AI-powered Insights**: Machine learning for personalized tips
- **Social Features**: Peer comparison and collaboration
- **Gamification**: Points, badges, and leaderboards
- **Advanced Analytics**: Detailed trading pattern analysis

### Integration Opportunities
- **Email Digest**: Daily/weekly activity summaries
- **Mobile App**: Push notifications for critical activities
- **LMS Integration**: Connect with learning management systems
- **Parent Portal**: Activity sharing with parents/guardians

### Personalization
- **Custom Notifications**: User-defined activity preferences
- **Theme Customization**: Personalized activity feed appearance
- **Content Filtering**: Advanced filtering and search
- **Activity Templates**: Custom activity types for instructors

## Conclusion

This Phase 1 Dashboard Activity Feed implementation will provide students with immediate visibility into their trading actions and portfolio changes, creating an engaging foundation for student engagement. By focusing on core Trading and Portfolio activities, we establish a solid base for future educational and market activity features.

The streamlined 3-week implementation leverages your existing robust trading infrastructure [[memory:2499476]] and database models, ensuring 95% infrastructure reuse with minimal new development required.

**Phase 1 delivers:**
- **Real-time Trading Activity**: Immediate feedback on successful orders and executions
- **Portfolio Change Tracking**: Milestone achievements and position updates
- **Dashboard Integration**: Seamless addition to existing dashboard layout
- **Foundation for Growth**: Extensible architecture for future activity types

**Key success factors for Phase 1:**
1. **Seamless Integration** with existing trading APIs (market-order, limit-order)
2. **Real-time Activity Generation** triggered by actual trade events
3. **Clean UI Integration** matching existing dashboard design patterns
4. **Solid Data Architecture** supporting future activity categories
5. **Performance Focus** ensuring fast activity creation and display

This focused approach allows for rapid delivery of core functionality while establishing the foundation for the comprehensive activity system outlined in the Future Phases section. 