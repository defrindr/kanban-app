'use client'

import { TrendingUp, Users, Activity, Zap } from 'lucide-react'
import { AnalyticsData } from '../types'

interface AnalyticsSummaryProps {
  data: AnalyticsData | null
}

export function AnalyticsSummary({ data }: AnalyticsSummaryProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const dailyAvgActivity = data.dailyActivity.length > 0
    ? Math.round(data.dailyActivity.reduce((sum, d) => sum + d.cardCreated, 0) / data.dailyActivity.length)
    : 0

  const activeUsers = data.userEngagement.filter(u => {
    const lastActive = new Date(u.lastActive)
    const daysAgo = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo < 7
  }).length

  const totalEngagement = data.userEngagement.reduce((sum, u) => sum + u.cardsCreated + u.commentsAdded, 0)

  const avgCardsPerBoard = data.stats.boards > 0 ? Math.round(data.stats.cards / data.stats.boards) : 0

  const metrics = [
    {
      label: 'Daily Avg Activity',
      value: dailyAvgActivity,
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Active Users (7d)',
      value: activeUsers,
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Engagement',
      value: totalEngagement,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Avg Cards/Board',
      value: avgCardsPerBoard,
      icon: Zap,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, i) => {
        const Icon = metric.icon
        return (
          <div key={i} className={`${metric.bgColor} rounded-lg border border-gray-200 dark:border-gray-700 p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value.toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{metric.label}</div>
          </div>
        )
      })}
    </div>
  )
}
