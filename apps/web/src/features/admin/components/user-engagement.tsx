'use client';

import { UserEngagementMetric } from '../types';

interface UserEngagementProps {
  data: UserEngagementMetric[];
}

export function UserEngagement({ data }: UserEngagementProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Engagement</h3>
        <div className="text-center py-8 text-gray-400">No user engagement data</div>
      </div>
    );
  }

  const maxScore = Math.max(...data.map((u) => u.cardsCreated + u.commentsAdded + u.boardsOwned));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Engagement</h3>
      <div className="space-y-3">
        {data.slice(0, 8).map((user) => {
          const score = user.cardsCreated + user.commentsAdded + user.boardsOwned;
          const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
          const lastActiveDate = new Date(user.lastActive);
          const daysAgo = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={user.userId} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {user.avatar || user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.username}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user.cardsCreated} cards, {user.commentsAdded} comments
                </div>
              </div>
              <div className="flex-shrink-0 w-24">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 w-12 text-right">
                {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
