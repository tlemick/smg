'use client';

import Link from 'next/link';

export function RankingPreview() {
  // Placeholder leaderboard data
  const topUsers = [
    { rank: 1, name: 'Alex Chen', returns: '+18.47%', portfolio: '$31,240' },
    { rank: 2, name: 'Sarah Kim', returns: '+15.23%', portfolio: '$28,950' },
    { rank: 3, name: 'Mike Johnson', returns: '+12.89%', portfolio: '$27,680' },
    { rank: 4, name: 'Emma Davis', returns: '+11.34%', portfolio: '$26,420' },
  ];

  const currentUserRank = 7;
  const currentUserReturns = '+8.96%';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Rankings</h2>
        <Link
          href="/ranking"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Your Position */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-blue-800">Your Position</h3>
            <p className="text-sm text-blue-600">Keep climbing the leaderboard!</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-800">#{currentUserRank}</p>
            <p className="text-sm text-blue-600">{currentUserReturns} returns</p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Top Performers</h3>
        {topUsers.map((user, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                user.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                user.rank === 2 ? 'bg-gray-100 text-gray-800' :
                user.rank === 3 ? 'bg-orange-100 text-orange-800' :
                'bg-gray-50 text-gray-700'
              }`}>
                {user.rank}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-600">{user.portfolio} portfolio</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">{user.returns}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          Compete with <span className="font-medium">127 traders</span> in the leaderboard
        </p>
      </div>
    </div>
  );
} 