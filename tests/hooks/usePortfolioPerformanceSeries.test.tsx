/**
 * Tests for usePortfolioPerformanceSeries Hook
 * 
 * WHY WE TEST THIS HOOK:
 * 1. Complex data transformation (API data → chart format)
 * 2. Uses useMemo (performance optimization we need to verify)
 * 3. Handles null/missing values (edge cases)
 * 4. Depends on external services (Formatters, ChartUtils)
 * 
 * WHAT WE'RE TESTING:
 * - Data fetching and state management
 * - Data transformation logic
 * - Null/empty data handling
 * - Computed values (formatted legend, chart config)
 * - Service integration (Formatters, ChartUtils)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePortfolioPerformanceSeries } from '@/hooks/usePortfolioPerformanceSeries';
import { ApiClient } from '@/lib/api';

// Mock the API client - we don't want real network requests in tests
jest.mock('@/lib/api/api-client');

// Mock the services - we'll test those separately
jest.mock('@/lib/financial/formatters', () => ({
  Formatters: {
    percentage: jest.fn((value, options) => {
      if (value === null) return '--';
      const sign = options?.showSign && value >= 0 ? '+' : '';
      return `${sign}${(value * 100).toFixed(2)}%`;
    }),
  },
}));

jest.mock('@/lib/chart-utils', () => ({
  ChartUtils: {
    getLastValidValue: jest.fn((values) => {
      // Find the last non-null value
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i] !== null) return values[i];
      }
      return null;
    }),
    calculateYDomain: jest.fn((values) => {
      if (values.length === 0) return [0, 0];
      const min = Math.min(...values);
      const max = Math.max(...values);
      return [min * 0.9, max * 1.1]; // Add 10% padding
    }),
    generateDateMarkersFromData: jest.fn((points, startDate, count) => {
      return []; // Simplified for tests
    }),
  },
}));

describe('usePortfolioPerformanceSeries', () => {
  // Reset all mocks before each test
  // WHY: Ensures tests don't affect each other
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST CATEGORY 1: Initial State
   * WHY: Verify the hook starts in a correct, predictable state
   */
  describe('initial state', () => {
    test('returns loading state on mount', () => {
      // Mock API to never resolve (simulates initial loading)
      (ApiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      // ASSERT: Hook should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  /**
   * TEST CATEGORY 2: Successful Data Fetching
   * WHY: Verify happy path - when everything works correctly
   */
  describe('successful data fetch', () => {
    test('fetches and transforms performance data', async () => {
      // ARRANGE: Setup mock API response
      const mockApiResponse = {
        success: true,
        data: {
          points: [
            { date: '2024-01-01', youPct: 0.05, sp500Pct: 0.03, leaderPct: 0.10 },
            { date: '2024-01-02', youPct: 0.07, sp500Pct: 0.04, leaderPct: 0.12 },
            { date: '2024-01-03', youPct: 0.10, sp500Pct: 0.05, leaderPct: 0.15 },
          ],
        },
        meta: {
          startDate: '2024-01-01',
        },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      // ACT: Render the hook
      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      // ASSERT: Wait for loading to finish
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Data was fetched
      expect(ApiClient.get).toHaveBeenCalledWith('/api/user/portfolio/performance-series');
      expect(result.current.data).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('transforms points to chart format', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [
            { date: '2024-01-01T00:00:00Z', youPct: 0.05, sp500Pct: 0.03, leaderPct: 0.10 },
          ],
        },
        meta: { startDate: '2024-01-01' },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.points.length).toBe(1);
      });

      // ASSERT: Points are transformed correctly
      const point = result.current.points[0];
      expect(point).toHaveProperty('date'); // Formatted date string
      expect(point).toHaveProperty('dateObj'); // Date object
      expect(point.youPct).toBe(0.05);
      expect(point.sp500Pct).toBe(0.03);
      expect(point.leaderPct).toBe(0.10);
    });

    test('formats legend values', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [
            { date: '2024-01-01', youPct: 0.1234, sp500Pct: 0.0567, leaderPct: 0.2345 },
          ],
        },
        meta: { startDate: '2024-01-01' },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Formatted object exists
      expect(result.current.formatted).toBeDefined();
      expect(result.current.formatted.legend).toBeDefined();
      
      // Note: Legend values depend on mocked ChartUtils.getLastValidValue and Formatters.percentage
      // These are mocked to return our expected format
      expect(result.current.formatted.legend.you).toBeDefined();
      expect(result.current.formatted.legend.sp500).toBeDefined();
      expect(result.current.formatted.legend.leader).toBeDefined();
    });
  });

  /**
   * TEST CATEGORY 3: Edge Cases
   * WHY: Real-world data is messy. Test how hook handles unusual inputs
   */
  describe('edge cases', () => {
    test('handles empty points array', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [],
        },
        meta: { startDate: '2024-01-01' },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Hook handles empty data gracefully
      expect(result.current.points).toEqual([]);
      expect(result.current.formatted.legend).toEqual({
        you: '--',
        sp500: '--',
        leader: '--',
      });
      expect(result.current.chartConfig.yDomain).toEqual([0, 0]);
    });

    test('handles null values in series', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [
            { date: '2024-01-01', youPct: null, sp500Pct: 0.03, leaderPct: 0.10 },
            { date: '2024-01-02', youPct: 0.05, sp500Pct: null, leaderPct: 0.12 },
            { date: '2024-01-03', youPct: 0.07, sp500Pct: 0.05, leaderPct: null },
          ],
        },
        meta: { startDate: '2024-01-01' },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.points.length).toBe(3);
      });

      // ASSERT: Null values are preserved (not filtered out)
      expect(result.current.points[0].youPct).toBeNull();
      expect(result.current.points[1].sp500Pct).toBeNull();
      expect(result.current.points[2].leaderPct).toBeNull();

      // ASSERT: Legend uses last VALID value (not null)
      expect(result.current.formatted.legend.you).toBe('+7.00%'); // Last valid: 0.07
      expect(result.current.formatted.legend.sp500).toBe('+5.00%'); // Last valid: 0.05
      expect(result.current.formatted.legend.leader).toBe('+12.00%'); // Last valid: 0.12
    });

    test('handles all-null series', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [
            { date: '2024-01-01', youPct: null, sp500Pct: null, leaderPct: null },
          ],
        },
        meta: { startDate: '2024-01-01' },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Shows '--' when no valid values exist
      expect(result.current.formatted.legend).toEqual({
        you: '--',
        sp500: '--',
        leader: '--',
      });
    });

    test('handles missing meta data', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [{ date: '2024-01-01', youPct: 0.05, sp500Pct: 0.03, leaderPct: 0.10 }],
        },
        meta: undefined, // Missing meta
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Hook doesn't crash
      expect(result.current.points.length).toBe(1);
      expect(result.current.chartConfig.yDomain).toEqual([0, 0]); // Fallback when meta is missing
    });
  });

  /**
   * TEST CATEGORY 4: Error Handling
   * WHY: Networks fail, APIs return errors. Test resilience.
   */
  describe('error handling', () => {
    test('handles API failure', async () => {
      (ApiClient.get as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Network timeout',
      });

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Error is captured (hook uses generic message)
      expect(result.current.error).toBe('Failed to fetch performance series');
      expect(result.current.data).toBeNull();
    });

    test('handles network exception', async () => {
      (ApiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Generic error message
      expect(result.current.error).toBe('Failed to fetch performance series');
      expect(result.current.data).toBeNull();
    });
  });

  /**
   * TEST CATEGORY 5: Refresh Functionality
   * WHY: Users need to refresh data. Test that it works.
   */
  describe('refresh', () => {
    test('refresh re-fetches data', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [{ date: '2024-01-01', youPct: 0.05, sp500Pct: 0.03, leaderPct: 0.10 }],
        },
        meta: { startDate: '2024-01-01' },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial fetch happened
      expect(ApiClient.get).toHaveBeenCalledTimes(1);

      // ACT: Call refresh (no need to wrap in act for synchronous call)
      result.current.refresh();

      await waitFor(() => {
        expect(ApiClient.get).toHaveBeenCalledTimes(2);
      });

      // ASSERT: Data was refetched
      expect(result.current.data).not.toBeNull();
    });
  });

  /**
   * TEST CATEGORY 6: Computed Values
   * WHY: Verify expensive calculations (useMemo) produce correct results
   */
  describe('computed values', () => {
    test('calculates chart config with valid y-domain', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          points: [
            { date: '2024-01-01', youPct: 0.05, sp500Pct: 0.03, leaderPct: 0.10 },
            { date: '2024-01-02', youPct: -0.02, sp500Pct: 0.01, leaderPct: 0.08 },
          ],
        },
        meta: { startDate: '2024-01-01' },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => usePortfolioPerformanceSeries());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // ASSERT: Chart config is calculated
      expect(result.current.chartConfig).toBeDefined();
      expect(result.current.chartConfig.yDomain).toBeDefined();
      expect(result.current.chartConfig.dateMarkers).toBeDefined();
      
      // ASSERT: Y-domain is array with two numbers
      const [yMin, yMax] = result.current.chartConfig.yDomain;
      expect(typeof yMin).toBe('number');
      expect(typeof yMax).toBe('number');
      
      // Our mock calculateYDomain adds 10% padding
      expect(yMin).toBeLessThan(0); // Includes negative value
      expect(yMax).toBeGreaterThan(0); // Includes positive value
    });
  });
});

/**
 * KEY TESTING LESSONS FROM THIS FILE:
 * 
 * 1. **Test Structure (Arrange-Act-Assert)**:
 *    - Arrange: Set up mocks and data
 *    - Act: Render hook or call function
 *    - Assert: Verify behavior
 * 
 * 2. **Mock External Dependencies**:
 *    - ApiClient: Don't make real network requests
 *    - Services (Formatters, ChartUtils): Test integration, not implementation
 * 
 * 3. **Test Categories**:
 *    - Initial state (is it correct before fetching?)
 *    - Happy path (does it work when everything goes right?)
 *    - Edge cases (empty data, null values, missing fields)
 *    - Error handling (API failures, network errors)
 *    - User actions (refresh, etc.)
 *    - Computed values (calculations, transformations)
 * 
 * 4. **What Makes a Good Test**:
 *    - Has a clear purpose (documented with comments)
 *    - Tests one thing (single concept per test)
 *    - Independent (doesn't rely on other tests)
 *    - Readable (clear variable names, arrange-act-assert)
 *    - Fast (mocks slow operations)
 * 
 * 5. **Why We Mock**:
 *    - Speed: Real API calls are slow
 *    - Reliability: Networks fail, tests shouldn't
 *    - Isolation: Test THIS code, not external code
 *    - Control: We decide what responses to test
 */
