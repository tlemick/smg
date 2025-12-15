import { useState, useEffect, useCallback } from 'react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchRankingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/ranking');
      const result: UserRankingResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch ranking data');
      }

      setData(result.data);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching ranking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ranking data');
    } finally {
      setLoading(false);
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
    loading,
    error,
    refresh,
    lastFetch,
    isStale,
    // Helper getters
    currentUserRank: data?.currentUser?.rank || 0,
    totalUsers: data?.currentUser?.totalUsers || 0,
    topUsers: data?.topUsers || [],
  };
}