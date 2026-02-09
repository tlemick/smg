import { useState, useEffect, useCallback } from 'react';
import { ApiClient, ApiError } from '@/lib/api';
import { Formatters } from '@/lib/financial';

export interface UserRankingData {
  currentUser: {
    rank: number;
    totalUsers: number;
    totalPortfolioValue: number;
    returnPercent?: number;
    name: string;
    avatarUrl?: string;
  };
  topUsers: Array<{
    rank: number;
    name: string;
    totalPortfolioValue?: number;
    returnPercent?: number;
    isCurrentUser: boolean;
    avatarUrl?: string;
  }>;
  meta: {
    totalActiveUsers: number;
    calculatedAt: string;
    sessionId?: string | null;
    startingCash?: number | null;
    isCached?: boolean;
  };
}

export interface UserRankingResponse {
  success: boolean;
  data: UserRankingData;
  timestamp: string;
  error?: string;
}

export function useUserRanking() {
  const [data, setData] = useState<UserRankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchRankingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiClient.get<UserRankingData>('/api/user/ranking');

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch ranking data');
      }

      setData(result.data!);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching ranking data:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load ranking data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchRankingData();
  }, [fetchRankingData]);

  useEffect(() => {
    fetchRankingData();
  }, [fetchRankingData]);

  const isStale = useCallback((maxAgeMinutes: number = 15) => {
    if (!lastFetch) return true;
    const now = new Date();
    const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
    return diffMinutes > maxAgeMinutes;
  }, [lastFetch]);

  return {
    data,
    isLoading,
    error,
    refresh,
    lastFetch,
    isStale,
    // Helper getters
    currentUserRank: data?.currentUser?.rank || 0,
    totalUsers: data?.currentUser?.totalUsers || 0,
    topUsers: data?.topUsers || [],
    // Formatted display values
    formattedTotalUsers: Formatters.number(data?.currentUser?.totalUsers),
    formattedCurrentRankDisplay:
      data?.currentUser?.rank && data?.currentUser?.totalUsers
        ? `${data.currentUser.rank} / ${Formatters.number(data.currentUser.totalUsers)}`
        : null,
  };
}