import { useUserRanking } from '@/hooks/useUserRanking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatName(name: string): string {
  if (!name) return 'Player';
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0].toUpperCase()}.` : '';
  return lastInitial ? `${first} ${lastInitial}` : first;
}

function formatPercent(pct?: number): string {
  if (pct === undefined || pct === null) return '--.--%';
  const rounded = Number(pct).toFixed(2);
  const signed = Number(pct) > 0 ? `+${rounded}` : rounded;
  return `${signed}%`;
}

export function LeaderboardCard() {
  const { topUsers, loading, error } = useUserRanking();

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
    <Card
      className="relative overflow-hidden"
      style={{ backgroundImage: 'url(/leaderboard-bg.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="bg-background/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/30 p-3 rounded text-sm mb-3">{error}</div>
          )}

          {loading ? (
            <div className="space-y-2">
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
                        <div className={`mt-2 text-foreground ${nameClass}`}>{formatName(u.name)}</div>
                        <div
                          className={`${percentClass} font-mono font-bold ${
                            (u.returnPercent ?? 0) > 0
                              ? 'text-green-600 dark:text-green-400'
                              : (u.returnPercent ?? 0) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatPercent(u.returnPercent)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Remaining ranks */}
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
                        <span className={`text-sm ${isCurrentUser ? 'font-semibold text-foreground' : 'text-foreground'}`}>{formatName(name)}</span>
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
                        {formatPercent(returnPercent)}
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
