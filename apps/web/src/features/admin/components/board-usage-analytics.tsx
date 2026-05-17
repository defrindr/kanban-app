'use client'

import { BoardUsageMetric } from '../types'

interface BoardUsageProps {
  data: BoardUsageMetric[]
}

export function BoardUsageAnalytics({ data }: BoardUsageProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Board Usage</h3>
        <div className="text-center py-8 text-gray-400">No board usage data</div>
      </div>
    )
  }

  const maxCards = Math.max(...data.map(b => b.cardsTotal))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Most Active Boards</h3>
      <div className="space-y-4">
        {data.slice(0, 6).map((board) => {
          const completionRate = board.cardsTotal > 0 ? Math.round((board.cardsCompleted / board.cardsTotal) * 100) : 0
          const barWidth = maxCards > 0 ? (board.cardsTotal / maxCards) * 100 : 0
          const lastActiveDate = new Date(board.lastActive)
          const daysAgo = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <div key={board.boardId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{board.boardName}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {board.cardsCompleted}/{board.cardsTotal} cards completed • {board.members} members
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{completionRate}%</div>
                  <div className="text-xs text-gray-400">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</div>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400"
                    style={{ width: `${barWidth}%` }}
                    title={`${board.cardsTotal} cards`}
                  />
                </div>
                <span className="text-gray-400 text-[10px] flex-shrink-0">{board.avgCardsPerDay.toFixed(1)} cards/day</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
