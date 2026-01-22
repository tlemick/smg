'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon, CircleNotchIcon, CheckCircleIcon, WarningCircleIcon, ClockIcon } from '@/components/ui';
import { RefreshCw } from 'lucide-react';

interface CronStatus {
  status: string;
  timestamp: string;
  orderProcessing: {
    pendingOrders: number;
    pendingLimitOrders: number;
    pendingMarketOrders: number;
    expiredOrders: number;
    totalProcessed: number;
  };
  system: {
    nodeEnv: string;
    hasCronConfig: boolean;
    internalCronEnabled: boolean;
  };
  info: {
    description: string;
    cronSchedule: string;
  };
}

/**
 * Cron Monitor - Admin Dashboard
 * 
 * Displays order processing system status and allows manual triggers.
 * Only accessible to admin users.
 */
export default function CronMonitorPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [lastTriggerResult, setLastTriggerResult] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Fetch cron status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/cron-status');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Manual trigger
  const handleManualTrigger = async () => {
    try {
      setTriggering(true);
      setLastTriggerResult(null);
      
      // Note: In production, this would need authentication
      const apiKey = prompt('Enter ORDER_PROCESSING_API_KEY for manual trigger:');
      
      if (!apiKey) {
        setLastTriggerResult('Cancelled by user');
        return;
      }
      
      const response = await fetch('/api/trade/process-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setLastTriggerResult(`Success: Processed ${result.processing.ordersProcessed} orders, Executed ${result.processing.ordersExecuted}, Expired ${result.processing.ordersExpired}`);
        // Refresh status after trigger
        setTimeout(fetchStatus, 1000);
      } else {
        setLastTriggerResult(`Error: ${result.error || 'Failed to process orders'}`);
      }
    } catch (err) {
      setLastTriggerResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTriggering(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cron Monitor</h1>
          <p className="text-muted-foreground">Order processing system status</p>
        </div>
        <Button
          onClick={fetchStatus}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon 
              icon={status?.status === 'healthy' ? CheckCircleIcon : WarningCircleIcon} 
              className={status?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}
            />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive">{error}</div>
          ) : loading ? (
            <div className="flex items-center gap-2">
              <Icon icon={CircleNotchIcon} className="animate-spin" />
              <span>Loading...</span>
            </div>
          ) : status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-bold capitalize">{status.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-bold">
                    {new Date(status.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Environment</p>
                  <p className="text-lg font-bold uppercase">{status.system.nodeEnv}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cron Configured</p>
                  <p className="text-lg font-bold">
                    {status.system.hasCronConfig ? '✓ Yes' : '✗ No'}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Schedule</p>
                <p className="text-sm text-muted-foreground">{status.info.cronSchedule}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Order Statistics */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon={ClockIcon} />
              Order Processing Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {status.orderProcessing.pendingOrders}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Limit: {status.orderProcessing.pendingLimitOrders} | Market: {status.orderProcessing.pendingMarketOrders}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Expired Orders</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {status.orderProcessing.expiredOrders}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Total Processed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {status.orderProcessing.totalProcessed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Trigger */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Trigger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manually trigger order processing. This will process all pending orders immediately,
            regardless of market hours or schedule.
          </p>
          
          <Button
            onClick={handleManualTrigger}
            disabled={triggering}
            variant="outline"
          >
            {triggering ? (
              <>
                <Icon icon={CircleNotchIcon} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Trigger Order Processing'
            )}
          </Button>
          
          {lastTriggerResult && (
            <div className={`p-3 rounded-lg text-sm ${
              lastTriggerResult.startsWith('Success') 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                : lastTriggerResult.startsWith('Error')
                ? 'bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                : 'bg-muted'
            }`}>
              {lastTriggerResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
