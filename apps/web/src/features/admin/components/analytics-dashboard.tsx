'use client'

import { useEffect, useState } from 'react'
import { fetchAnalytics } from '../api/admin-analytics'
import { AnalyticsSummary } from './analytics-summary'
import { ActivityChart } from './activity-chart'
import { UserEngagement } from './user-engagement'
import { BoardUsageAnalytics } from './board-usage-analytics'
import type { AnalyticsData } from '../types'

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await fetchAnalytics()
      setAnalytics(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <AnalyticsSummary data={analytics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics && (
          <>
            <ActivityChart
              data={analytics.dailyActivity}
              metric="cardCreated"
              title="Cards Created (Last 30 Days)"
              color="bg-blue-500"
            />
            <ActivityChart
              data={analytics.dailyActivity}
              metric="cardCompleted"
              title="Cards Completed (Last 30 Days)"
              color="bg-green-500"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics && (
          <>
            <ActivityChart
              data={analytics.dailyActivity}
              metric="commentAdded"
              title="Comments Added (Last 30 Days)"
              color="bg-purple-500"
            />
            <ActivityChart
              data={analytics.dailyActivity}
              metric="userActive"
              title="Active Users (Last 30 Days)"
              color="bg-orange-500"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics && (
          <>
            <UserEngagement data={analytics.userEngagement} />
            <BoardUsageAnalytics data={analytics.boardUsage} />
          </>
        )}
      </div>

      {analytics && analytics.topContributors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {analytics.topContributors.slice(0, 5).map((contributor, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                    {contributor.avatar || contributor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contributor.name}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{contributor.contributions}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">contributions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
