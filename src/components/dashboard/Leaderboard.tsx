import { useUserRanking } from '@/hooks/useUserRanking';

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

export function Leaderboard() {
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
    <div
      className="relative rounded-lg overflow-hidden"
      style={{ backgroundImage: 'url(/leaderboard-bg.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="p-6 bg-neutral-50/20 dark:bg-neutral-900/40">
        <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-4">Leaderboard</h5>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 p-3 rounded text-sm mb-3">{error}</div>
        )}

        {loading ? (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="py-2 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
                <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
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
                  const badgeBase = 'absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1 inline-flex items-center justify-center h-6 w-6 rounded-full border border-white dark:border-gray-800 shadow text-xs font-bold';
                  const badgeClass = isFirst
                    ? `${badgeBase} bg-yellow-300 dark:bg-yellow-400 text-black dark:text-gray-900`
                    : u.rank === 2
                    ? `${badgeBase} bg-gray-200 dark:bg-gray-400 text-black dark:text-gray-900`
                    : `${badgeBase} bg-amber-300 dark:bg-amber-400 text-black dark:text-gray-900`;

                  return (
                    <div key={`podium-${u.rank}`} className={`flex flex-col items-center ${isFirst ? '' : 'mb-2'}`}>
                      <div className="relative pb-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className={`rounded-full object-cover border border-white shadow ${ringClass}`}
                            style={{ height: size, width: size }}
                          />
                        ) : (
                          <div className={`rounded-full bg-neutral-200 dark:bg-neutral-700 border border-white dark:border-gray-800 shadow ${ringClass}`} style={{ height: size, width: size }} />
                        )}
                        <span className={badgeClass}>{u.rank}</span>
                      </div>
                      <div className={`mt-2 text-neutral-900 dark:text-neutral-100 ${nameClass}`}>{formatName(u.name)}</div>
                      <div
                        className={`${percentClass} font-mono font-bold ${
                          (u.returnPercent ?? 0) > 0
                            ? 'text-green-800 dark:text-green-400'
                            : (u.returnPercent ?? 0) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-neutral-700 dark:text-neutral-300'
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
              <div className="divide-y divide-white dark:divide-gray-700">
                {others.map(({ rank, name, returnPercent, isCurrentUser, avatarUrl }) => (
                  <div key={rank} className={`py-4 flex items-center justify-between ${isCurrentUser ? 'bg-neutral-100/50 dark:bg-neutral-800/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold ${
                          rank === 1
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                            : rank === 2
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            : rank === 3
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                            : 'bg-white/20 dark:bg-gray-800/40 text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {rank}
                      </span>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={name} className="h-7 w-7 rounded-full object-cover border border-neutral-200 dark:border-neutral-600" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                      )}
                      <span className={`text-sm ${isCurrentUser ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-800 dark:text-neutral-200'}`}>{formatName(name)}</span>
                    </div>
                    <span
                      className={`text-sm font-mono font-bold ${
                        (returnPercent ?? 0) > 0 ? 'text-green-800 dark:text-green-400' : (returnPercent ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'
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
      </div>
    </div>
  );
}