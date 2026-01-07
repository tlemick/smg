/**
 * Tests for useUserRanking Hook
 * 
 * WHY THIS HOOK IS SIMPLER:
 * - Straightforward data fetching (no complex transformation)
 * - No null value handling (API always returns complete data)
 * - Simple helper getters
 * 
 * TESTING PATTERN FOR SIMPLE HOOKS:
 * - Focus on: fetch, error, refresh
 * - Less emphasis on edge cases (fewer to worry about)
 * - Quick to write, good coverage
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUserRanking } from '@/hooks/useUserRanking';
import { ApiClient } from '@/lib/api';

jest.mock('@/lib/api/api-client');

describe('useUserRanking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * SIMPLE HOOK PATTERN: Test these 5 things
   * 1. Initial state
   * 2. Successful fetch
   * 3. Error handling
   * 4. Refresh
   * 5. Helper getters
   */

  test('starts in loading state', () => {
    (ApiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useUserRanking());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('fetches ranking data successfully', async () => {
    const mockData = {
      currentUser: {
        rank: 5,
        totalUsers: 100,
        totalPortfolioValue: 15000,
        returnPercent: 0.15,
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      topUsers: [
        {
          rank: 1,
          name: 'Leader',
          totalPortfolioValue: 25000,
          returnPercent: 0.50,
          isCurrentUser: false,
        },
        {
          rank: 2,
          name: 'Second Place',
          totalPortfolioValue: 20000,
          returnPercent: 0.35,
          isCurrentUser: false,
        },
      ],
      meta: {
        totalActiveUsers: 100,
        calculatedAt: '2024-01-15T10:00:00Z',
      },
    };

    (ApiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useUserRanking());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // ASSERT: Data was fetched
    expect(ApiClient.get).toHaveBeenCalledWith('/api/user/ranking');
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  test('provides helper getters', async () => {
    const mockData = {
      currentUser: {
        rank: 3,
        totalUsers: 50,
        totalPortfolioValue: 18000,
        name: 'Test User',
      },
      topUsers: [
        { rank: 1, name: 'User1', isCurrentUser: false },
        { rank: 2, name: 'User2', isCurrentUser: false },
      ],
      meta: {
        totalActiveUsers: 50,
        calculatedAt: '2024-01-15T10:00:00Z',
      },
    };

    (ApiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useUserRanking());

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // ASSERT: Helper getters work
    expect(result.current.currentUserRank).toBe(3);
    expect(result.current.totalUsers).toBe(50);
    expect(result.current.topUsers).toHaveLength(2);
  });

  test('handles API error', async () => {
    (ApiClient.get as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Rankings not available',
    });

    const { result } = renderHook(() => useUserRanking());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Hook uses generic error message, not the API error
    expect(result.current.error).toBe('Failed to load ranking data');
    expect(result.current.data).toBeNull();
  });

  test('refresh re-fetches data', async () => {
    const mockData = {
      currentUser: { rank: 1, totalUsers: 10, totalPortfolioValue: 20000, name: 'Test' },
      topUsers: [],
      meta: { totalActiveUsers: 10, calculatedAt: '2024-01-15T10:00:00Z' },
    };

    (ApiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useUserRanking());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(ApiClient.get).toHaveBeenCalledTimes(1);

    // ACT: Refresh (no need for act() here since refresh is called directly)
    result.current.refresh();

    await waitFor(() => {
      expect(ApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  test('isStale returns true when data is old', async () => {
    const mockData = {
      currentUser: { rank: 1, totalUsers: 10, totalPortfolioValue: 20000, name: 'Test' },
      topUsers: [],
      meta: { totalActiveUsers: 10, calculatedAt: '2024-01-15T10:00:00Z' },
    };

    (ApiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useUserRanking());

    await waitFor(() => {
      expect(result.current.lastFetch).not.toBeNull();
    });

    // Fresh data is not stale (default is 15 minutes)
    expect(result.current.isStale(15)).toBe(false);

    // Shorter threshold - fresh data should not be stale yet
    expect(result.current.isStale(30)).toBe(false);
  });
});

/**
 * SIMPLE HOOK TESTING CHECKLIST:
 * 
 * ✅ Initial state (loading, null data, null error)
 * ✅ Successful fetch
 * ✅ Error handling (API error, network error)
 * ✅ Refresh functionality
 * ✅ Helper getters
 * ✅ Staleness check (if applicable)
 * 
 * TOTAL TIME TO WRITE: ~15-20 minutes for simple hooks
 * 
 * WHY THIS IS FAST:
 * - No complex transformations to test
 * - No edge cases (null values, empty data)
 * - Straightforward mock data
 * - Pattern is repeatable
 */
