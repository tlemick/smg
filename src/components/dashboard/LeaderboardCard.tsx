import { useUserRanking } from '@/hooks/useUserRanking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Formatters } from '@/lib/financial';

export function LeaderboardCard() {
  const { topUsers, isLoading, error, data } = useUserRanking();

  const topThree = (topUsers || []).slice(0, 3);
  const others = (topUsers || []).slice(3);

  // Arrange podium visually as 3 - 1 - 2 to match the reference design
  const podiumOrdered = (() => {
    const order = [3, 1, 2];
    const map = new Map((topThree || []).map(u => [u.rank, u] as const));
    const result = order.map(r => map.get(r)).filter(Boolean) as typeof topThree;
    return result.length ? result : topThree;
  })();

  return (
    <Card className="leaderboard-gradient-bg border-0 w-full">
      <div className="leaderboard-gradient-content bg-background/75 dark:bg-background/85 backdrop-blur-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Leaderboard</CardTitle>
            {data?.meta?.isCached && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(data.meta.calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/30 p-3 rounded text-sm mb-3">{error}</div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {/* space-y-2 = 8px (2 units), py-2 = 8px (2 units), h-6/h-4 = 24px/16px (6/4 units) */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              {podiumOrdered.length > 0 && (
                <div className="flex items-end justify-center gap-8 mb-5">
                  {podiumOrdered.map((u) => {
                    const isFirst = u.rank === 1;
                    const size = isFirst ? 96 : 72; // px to match prominent roundels
                    const nameClass = isFirst ? 'text-base font-semibold' : 'text-sm font-medium';
                    const percentClass = isFirst ? 'text-sm' : 'text-xs';
                    const ringClass = isFirst
                      ? 'ring-2 ring-yellow-400 dark:ring-yellow-500'
                      : u.rank === 2
                      ? 'ring-2 ring-gray-300 dark:ring-gray-500'
                      : 'ring-2 ring-amber-400 dark:ring-amber-500';
                    const badgeBase = 'absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1 inline-flex items-center justify-center h-6 w-6 rounded-full border border-background shadow text-xs font-bold';
                    const badgeClass = isFirst
                      ? `${badgeBase} bg-yellow-300 dark:bg-yellow-400 text-foreground`
                      : u.rank === 2
                      ? `${badgeBase} bg-gray-200 dark:bg-gray-400 text-foreground`
                      : `${badgeBase} bg-amber-300 dark:bg-amber-400 text-foreground`;

                    return (
                      <div key={`podium-${u.rank}`} className={`flex flex-col items-center ${isFirst ? '' : 'mb-2'}`}>
                        <div className="relative pb-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className={`rounded-full object-cover border border-background shadow ${ringClass}`}
                              style={{ height: size, width: size }}
                            />
                          ) : (
                            <div className={`rounded-full bg-muted border border-background shadow ${ringClass}`} style={{ height: size, width: size }} />
                          )}
                          <span className={badgeClass}>{u.rank}</span>
                        </div>
                        <div className={`mt-2 text-foreground ${nameClass}`}>{Formatters.formatUserName(u.name)}</div>
                        <div
                          className={`${percentClass} font-mono font-bold ${
                            (u.returnPercent ?? 0) > 0
                              ? 'text-green-600 dark:text-green-400'
                              : (u.returnPercent ?? 0) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {Formatters.percentage(u.returnPercent ?? 0, { decimals: 2, showSign: true, multiplier: 1 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Remaining ranks - py-4 = 16px (4 units), gap-3 = 12px (3 units), h-6/h-7 = 24px/28px (6/7 units) */}
              {others.length > 0 && (
                <div className="divide-y divide-border">
                  {others.map(({ rank, name, returnPercent, isCurrentUser, avatarUrl }) => (
                    <div key={rank} className={`py-4 flex items-center justify-between ${isCurrentUser ? 'bg-muted/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold ${
                            rank === 1
                              ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                              : rank === 2
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              : rank === 3
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {rank}
                        </span>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={name} className="h-7 w-7 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted" />
                        )}
                        <span className={`text-sm ${isCurrentUser ? 'font-semibold text-foreground' : 'text-foreground'}`}>{Formatters.formatUserName(name)}</span>
                      </div>
                      <span
                        className={`text-sm font-mono font-bold ${
                          (returnPercent ?? 0) > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : (returnPercent ?? 0) < 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        {Formatters.percentage(returnPercent ?? 0, { decimals: 2, showSign: true, multiplier: 1 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
