import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityFeedResponse, ActivityFeedOptions, UserActivity, ActivityCategory } from '@/types';
import { ApiClient, ApiError } from '@/lib/api';

export function useActivityFeed(options: ActivityFeedOptions = {}) {
  const {
    limit = 20,
    categories,
    realTime = false,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<ActivityFeedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const queryParams: Record<string, any> = { limit };
      if (categories && categories.length > 0) {
        queryParams.categories = categories.join(',');
      }

      const queryString = ApiClient.buildQueryString(queryParams);
      const result = await ApiClient.get<ActivityFeedResponse['data']>(`/api/user/activity${queryString}`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch activities');
      }

      setData(result as ActivityFeedResponse);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching activities:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load activities';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit, categories]);

  const markAsRead = useCallback(async (activityIds: string[]) => {
    try {
      const result = await ApiClient.post('/api/user/activity', {
        action: 'mark_read',
        activityIds
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark activities as read');
      }

      // Update local state to mark activities as read
      setData(prevData => {
        if (!prevData || !prevData.data) return prevData;
        
        return {
          ...prevData,
          data: {
            ...prevData.data,
            activities: prevData.data.activities.map(activity => 
              activityIds.includes(activity.id) 
                ? { ...activity, read: true }
                : activity
            )
          }
        };
      });

      return result;
    } catch (err) {
      console.error('Error marking activities as read:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  const isStale = useCallback((maxAgeMinutes: number = 5) => {
    if (!lastFetch) return true;
    const now = new Date();
    const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
    return diffMinutes > maxAgeMinutes;
  }, [lastFetch]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const startAutoRefresh = () => {
        refreshTimeoutRef.current = setTimeout(() => {
          if (!document.hidden) { // Only refresh if tab is visible
            refresh();
          }
          startAutoRefresh(); // Schedule next refresh
        }, refreshInterval);
      };

      startAutoRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Helper functions for filtering and organizing activities
  const getActivitiesByType = useCallback((type: ActivityCategory) => {
    return data?.data?.activities.filter(activity => activity.type === type) || [];
  }, [data]);

  const getUnreadCount = useCallback(() => {
    return data?.data?.activities.filter(activity => !activity.read).length || 0;
  }, [data]);

  const getHighPriorityActivities = useCallback(() => {
    return data?.data?.activities.filter(activity => activity.importance >= 2) || [];
  }, [data]);

  return {
    // Core data
    data,
    activities: data?.data?.activities || [],
    isLoading,
    error,
    lastFetch,

    // Actions
    refresh,
    markAsRead,

    // Utility functions
    isStale,
    getActivitiesByType,
    getUnreadCount,
    getHighPriorityActivities,

    // Stats
    stats: data?.data?.stats || {},
    pagination: data?.data?.pagination || { limit, offset: 0, total: 0, hasMore: false },
    
    // Helper getters
    hasActivities: (data?.data?.activities?.length || 0) > 0,
    totalCount: data?.data?.pagination?.total || 0,
    unreadCount: getUnreadCount()
  };
} 