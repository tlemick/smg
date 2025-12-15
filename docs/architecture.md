# Stock Market Game (SMG) Architecture

## Overview

The Stock Market Game is a Next.js-based financial simulation platform that provides real-time and historical stock market data through a sophisticated multi-layer architecture. The system integrates Yahoo Finance APIs with local database storage and intelligent caching to deliver fast, reliable financial data to users.

## Architecture Layers

### 1. Data Sources & External APIs

#### Yahoo Finance Integration
- **Primary Data Source**: `yahoo-finance2` npm package
- **Capabilities**:
  - Real-time stock quotes
  - Historical price data (OHLCV)
  - Company search functionality
  - Asset profiles and metadata
- **Rate Limiting**: Managed through intelligent caching to minimize API calls

### 2. Database Layer (PostgreSQL + Prisma)

#### Core Data Models

**Assets & Market Data**:
- `Asset`: Central model for all tradable securities (stocks, bonds, ETFs, mutual funds)
- `Stock`, `Bond`, `MutualFund`: Specialized asset type details
- `DailyAggregate`: Historical OHLCV data storage
- `AssetProfile`: Company/fund profile information

**Caching Tables**:
- `AssetQuoteCache`: Real-time quote caching (30s TTL)
- `YahooSearchCache`: Search results caching (1h TTL)

**User & Portfolio Management**:
- `User`: User authentication and profiles
- `Portfolio`: Investment portfolios within game sessions
- `GameSession`: Trading simulation parameters
- `Holding`: Current asset positions
- `Transaction`: Trade history
- `Order`, `LimitOrder`: Trading orders

**Watchlists**:
- `Watchlist`: User-created asset tracking lists
- `WatchlistItem`: Individual assets in watchlists

**Performance Tracking**:
- `PortfolioPerformance`: Historical portfolio value tracking
- `Daily_SP500`: Market benchmark data

### 3. Service Layer

#### Yahoo Finance Service (`/src/lib/yahoo-finance-service.ts`)

**Core Functions**:
- `getAssetQuoteWithCache()`: Intelligent quote retrieval with fallback
- `getWatchlistQuotes()`: Batch quote fetching for watchlists
- `syncAssetHistoricalData()`: Historical data synchronization
- `searchWithCache()`: Cached search functionality
- `createAssetFromTicker()`: Dynamic asset creation

**Caching Strategy**:
- **Quote Cache TTL**: 30 seconds (real-time data)
- **Search Cache TTL**: 1 hour (search results)
- **Fallback Logic**: Returns stale cache if API fails
- **Graceful Degradation**: System continues with cached data during outages

### 4. API Layer (Next.js App Router)

#### REST Endpoints

**Quote API** (`/api/quote`)
- **Method**: POST
- **Features**: Real-time quotes with optional historical data
- **Caching**: Automatic quote caching with cache age metadata
- **Auto-creation**: Creates assets if they don't exist

**Chart API** (`/api/chart`)
- **Method**: POST  
- **Features**: Historical price data for charting
- **Sync**: Automatic historical data synchronization
- **Flexibility**: Configurable date ranges and intervals

**Search API** (`/api/search`)
- **Method**: POST
- **Features**: Cached asset search with validation
- **Rate Limiting**: Built-in request validation and limits

**Watchlist Quotes API** (`/api/watchlist/[id]/quotes`)
- **Method**: GET
- **Features**: Batch quote retrieval for watchlist items
- **Performance**: Parallel processing with error handling

### 5. Frontend Layer

#### Next.js Application Structure
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI components

#### Custom Hooks (`/src/hooks/useStockApi.ts`)
- **Purpose**: Standardized API interaction layer
- **Features**: Loading states, error handling, type safety
- **Methods**: `getQuote()`, `getChart()`, `search()`

#### Type System (`/src/types/index.ts`)
- **Comprehensive Types**: Complete TypeScript definitions for all API interactions
- **Serialization**: Special handling for BigInt values in JSON responses
- **API Contracts**: Strict request/response type definitions

## Data Flow Architecture

### Real-Time Quote Flow
```
Frontend → API (/api/quote) → Yahoo Service → Check Cache → 
Cache Hit: Return cached data (with metadata)
Cache Miss: Fetch from Yahoo Finance → Update cache → Return fresh data
API Failure: Return stale cache (if available) with error flag
```

### Historical Data Flow
```
Frontend → API (/api/chart) → Yahoo Service → Check Database → 
Data Missing: Sync from Yahoo Finance → Store in DailyAggregate → Return data
Data Available: Return from database
Sync Requested: Force fetch from Yahoo Finance → Update database → Return data
```

### Search Flow
```
Frontend → API (/api/search) → Yahoo Service → Check Cache →
Cache Hit: Return cached results
Cache Miss: Search Yahoo Finance → Cache results → Return data
```

## Caching Strategy

### Multi-Level Caching
1. **Database Cache Tables**: Persistent caching in PostgreSQL
2. **TTL-Based Expiration**: Different TTLs for different data types
3. **Stale Data Tolerance**: System continues with expired cache during API failures
4. **Background Refresh**: Automatic cache updates on successful API calls

### Cache Levels & TTLs
- **Real-time Quotes**: 30 seconds
- **Search Results**: 1 hour  
- **Historical Data**: Persistent (manual sync available)

### Fallback Strategy
1. **Primary**: Fresh API data
2. **Secondary**: Valid cached data
3. **Tertiary**: Stale cached data (with warning flags)
4. **Last Resort**: Error response with context

## Performance Optimizations

### Database Optimizations
- **Composite Indexes**: `assetId_date` for historical data lookups
- **Foreign Key Indexes**: Optimized joins across tables
- **BigInt Support**: Proper handling of large volume/market cap values

### API Optimizations
- **Batch Processing**: Parallel quote fetching for watchlists
- **Connection Pooling**: Prisma connection management
- **Error Isolation**: Individual asset failures don't affect batch operations

### Frontend Optimizations
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Standardized Hooks**: Consistent API interaction patterns
- **Error Boundaries**: Graceful error handling at component level

## Scalability Considerations

### Current Architecture Benefits
- **Horizontal Scaling**: Stateless API design
- **Database Scaling**: PostgreSQL supports read replicas
- **Cache Efficiency**: Reduces external API dependency
- **Modularity**: Clear separation of concerns

### Future Enhancements
- **Redis Integration**: External cache layer for better performance
- **WebSocket Support**: Real-time data streaming
- **CDN Integration**: Static asset optimization
- **Microservices**: Service decomposition for larger scale

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **External API**: Yahoo Finance 2

### Frontend  
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **State Management**: React Hooks

### Development
- **Package Manager**: npm
- **Database Migrations**: Prisma Migrate
- **Type Safety**: Full TypeScript coverage
- **API Design**: RESTful with JSON responses

## Security & Reliability

### Data Integrity
- **Database Constraints**: Foreign keys and unique constraints
- **Input Validation**: API request validation
- **Type Safety**: TypeScript prevents type-related errors

### Error Handling
- **Graceful Degradation**: System continues with cached data
- **Detailed Logging**: Comprehensive error logging
- **User-Friendly Errors**: Clean error messages for frontend

### Caching Reliability
- **Expiration Handling**: Automatic cache cleanup
- **Fallback Mechanisms**: Multiple fallback levels
- **Data Consistency**: Cache invalidation strategies 

## Recent Changes

### Yahoo Finance API Migration (July 2025)

**Migration from `historical()` to `chart()` API**

Due to Yahoo Finance deprecating their `historical()` API method, we have migrated to using the `chart()` API for all historical data fetching. This migration includes:

- **Core Service Layer**: Updated `syncAssetHistoricalData()` in `yahoo-finance-service.ts` to use `chart()` instead of `historical()`
- **Data Adapter**: Added `transformChartDataToHistoricalFormat()` utility to ensure compatibility
- **API Endpoints**: Updated `/api/chart` and `/api/quote` routes with improved error handling
- **Cleanup**: Removed deprecated `/api/asset/[id]/historical` endpoint
- **Notice Suppression**: Added `yahooFinance.suppressNotices(['ripHistorical'])` to suppress warnings

**Impact**: No breaking changes for existing clients. All functionality remains the same with improved reliability.

**Migration Status**: ✅ Completed - All endpoints tested and working 