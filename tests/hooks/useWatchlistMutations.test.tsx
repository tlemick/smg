/**
 * Tests for useWatchlistMutations Hook
 * 
 * WHY THIS HOOK IS DIFFERENT:
 * - It's a MUTATION hook (creates/deletes data, not just fetches)
 * - Returns functions that return Promise<T | null>
 * - Has client-side validation
 * - Has separate loading states for each operation
 * 
 * TESTING MUTATIONS VS QUERIES:
 * - Queries: Test data fetching and transformation
 * - Mutations: Test user actions, validation, error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWatchlistMutations } from '@/hooks/useWatchlistMutations';
import { ApiClient } from '@/lib/api';
import { WatchlistDetailed } from '@/types';

jest.mock('@/lib/api/api-client');

describe('useWatchlistMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST PATTERN 1: Initial State
   * Mutations should start in idle state (not loading, no error)
   */
  describe('initial state', () => {
    test('starts in idle state', () => {
      const { result } = renderHook(() => useWatchlistMutations());

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  /**
   * TEST PATTERN 2: Client-Side Validation
   * WHY: Test validation BEFORE making API calls
   * BENEFIT: Saves network requests, faster UX
   */
  describe('createWatchlist - validation', () => {
    test('rejects empty name', async () => {
      const { result } = renderHook(() => useWatchlistMutations());

      let watchlist: WatchlistDetailed | null;
      
      // ACT: Try to create watchlist with empty name
      await act(async () => {
        watchlist = await result.current.createWatchlist('');
      });

      // ASSERT: Validation error set, no API call made
      expect(watchlist!).toBeNull();
      expect(result.current.error).toBe('Watchlist name is required');
      expect(ApiClient.post).not.toHaveBeenCalled();
    });

    test('trims whitespace from name', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          name: 'My Watchlist', // Trimmed
          items: [],
          itemCount: 0,
        },
      };

      (ApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWatchlistMutations());

      await act(async () => {
        await result.current.createWatchlist('  My Watchlist  ');
      });

      // ASSERT: Name was trimmed before sending to API
      expect(ApiClient.post).toHaveBeenCalledWith('/api/watchlist', {
        name: 'My Watchlist',
      });
    });
  });

  /**
   * TEST PATTERN 3: Successful Mutations
   * Test the happy path for create/delete operations
   */
  describe('createWatchlist - success', () => {
    test('creates watchlist successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'watchlist-1',
          name: 'Tech Stocks',
          items: [],
          itemCount: 0,
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      (ApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWatchlistMutations());

      let watchlist: WatchlistDetailed | null = null;

      // ACT: Create watchlist
      await act(async () => {
        watchlist = await result.current!.createWatchlist('Tech Stocks');
      });

      // ASSERT: API was called correctly
      expect(ApiClient.post).toHaveBeenCalledWith('/api/watchlist', {
        name: 'Tech Stocks',
      });

      // ASSERT: Watchlist was returned
      expect(watchlist).toEqual(mockResponse.data);
      expect(result.current.error).toBeNull();
    });

    test('sets loading state during creation', async () => {
      // Mock API to delay response
      (ApiClient.post as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { id: '1', name: 'Test', items: [], itemCount: 0 },
        }), 50))
      );

      const { result } = renderHook(() => useWatchlistMutations());

      // Start creation
      let createPromise: Promise<void>;
      act(() => {
        createPromise = result.current!.createWatchlist('Test').then(() => {});
      });

      // Wait for loading state to be set (may happen immediately)
      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      }, { timeout: 100 });

      // Wait for completion
      await act(async () => {
        await createPromise!;
      });

      // ASSERT: Loading state is cleared
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('deleteWatchlist - success', () => {
    test('deletes watchlist successfully', async () => {
      const mockResponse = {
        success: true,
      };

      (ApiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWatchlistMutations());

      let success: boolean = false;

      // ACT: Delete watchlist
      await act(async () => {
        success = await result.current!.deleteWatchlist('watchlist-1');
      });

      // ASSERT: API was called
      expect(ApiClient.delete).toHaveBeenCalledWith('/api/watchlist/watchlist-1');

      // ASSERT: Operation succeeded
      expect(success).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('sets loading state during deletion', async () => {
      (ApiClient.delete as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 50))
      );

      const { result } = renderHook(() => useWatchlistMutations());

      let deletePromise: Promise<void>;
      act(() => {
        deletePromise = result.current!.deleteWatchlist('watchlist-1').then(() => {});
      });

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true);
      }, { timeout: 100 });

      await act(async () => {
        await deletePromise!;
      });

      // ASSERT: Loading state is cleared
      expect(result.current.isDeleting).toBe(false);
    });
  });

  /**
   * TEST PATTERN 4: Error Handling for Mutations
   * Test API failures and network errors
   */
  describe('error handling', () => {
    test('handles create failure from API', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Watchlist already exists',
      });

      const { result } = renderHook(() => useWatchlistMutations());

      let watchlist: WatchlistDetailed | null = null;

      await act(async () => {
        watchlist = await result.current!.createWatchlist('Duplicate');
      });

      // ASSERT: Error is set, null is returned
      expect(watchlist).toBeNull();
      expect(result.current.error).toBe('Watchlist already exists');
    });

    test('handles network error during creation', async () => {
      (ApiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWatchlistMutations());

      let watchlist: WatchlistDetailed | null = null;

      await act(async () => {
        watchlist = await result.current!.createWatchlist('Test');
      });

      // ASSERT: Generic error message
      expect(watchlist).toBeNull();
      expect(result.current.error).toBe('Failed to create watchlist');
    });

    test('handles delete failure', async () => {
      (ApiClient.delete as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Watchlist not found',
      });

      const { result } = renderHook(() => useWatchlistMutations());

      let success: boolean = false;

      await act(async () => {
        success = await result.current!.deleteWatchlist('invalid-id');
      });

      // ASSERT: Returns false, error is set
      expect(success).toBe(false);
      expect(result.current.error).toBe('Watchlist not found');
    });

    test('clears error when clearError is called', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Some error',
      });

      const { result } = renderHook(() => useWatchlistMutations());

      // Create error
      await act(async () => {
        await result.current!.createWatchlist('Test');
      });

      expect(result.current.error).toBe('Some error');

      // ACT: Clear error
      act(() => {
        result.current!.clearError();
      });

      // ASSERT: Error is cleared
      expect(result.current.error).toBeNull();
    });
  });

  /**
   * TEST PATTERN 5: Multiple Operations
   * Test that operations don't interfere with each other
   */
  describe('multiple operations', () => {
    test('can create multiple watchlists sequentially', async () => {
      (ApiClient.post as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: { id: '1', name: 'First', items: [], itemCount: 0 },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { id: '2', name: 'Second', items: [], itemCount: 0 },
        });

      const { result } = renderHook(() => useWatchlistMutations());

      let first: WatchlistDetailed | null = null;
      let second: WatchlistDetailed | null = null;

      // ACT: Create two watchlists
      await act(async () => {
        first = await result.current!.createWatchlist('First');
        second = await result.current!.createWatchlist('Second');
      });

      // ASSERT: Both were created
      expect(first?.name).toBe('First');
      expect(second?.name).toBe('Second');
      expect(ApiClient.post).toHaveBeenCalledTimes(2);
    });

    test('create and delete are independent', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: '1', name: 'Test', items: [], itemCount: 0 },
      });

      (ApiClient.delete as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useWatchlistMutations());

      // ACT: Create then delete
      await act(async () => {
        await result.current!.createWatchlist('Test');
        await result.current!.deleteWatchlist('1');
      });

      // ASSERT: Both operations succeeded
      expect(result.current.error).toBeNull();
      expect(ApiClient.post).toHaveBeenCalledTimes(1);
      expect(ApiClient.delete).toHaveBeenCalledTimes(1);
    });
  });
});

/**
 * KEY LESSONS FOR MUTATION TESTING:
 * 
 * 1. **Test Client-Side Validation First**:
 *    - Faster feedback for users
 *    - Saves network requests
 *    - Test validation before API calls
 * 
 * 2. **Test Loading States**:
 *    - Mutations take time
 *    - Users need visual feedback
 *    - Test that isLoading flags work
 * 
 * 3. **Test Return Values**:
 *    - Mutations return success/failure
 *    - Components need to know what happened
 *    - Test both success (return data) and failure (return null/false)
 * 
 * 4. **Test Error Handling**:
 *    - API can fail (validation, business logic)
 *    - Network can fail (timeout, offline)
 *    - Test both scenarios
 * 
 * 5. **Test Independent Operations**:
 *    - Multiple mutations shouldn't interfere
 *    - Each operation should have its own loading state
 *    - Test sequential and parallel operations
 */
