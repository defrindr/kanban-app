'use client'

import { Card } from '@/features/kanban/types/kanban'
import Link from 'next/link'

interface TimelineViewProps {
  cards: Card[]
}

export function TimelineView({ cards }: TimelineViewProps) {
  // Filter cards with due dates and sort by due date
  const tasksByDueDate = [...cards]
    .filter(c => c.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  // Group by date ranges
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const thisWeekEnd = new Date(today)
  thisWeekEnd.setDate(thisWeekEnd.getDate() + (6 - today.getDay()))
  
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const categorizeTask = (dueDate: string) => {
    const date = new Date(dueDate)
    date.setHours(0, 0, 0, 0)
    
    if (date < today) return 'overdue'
    if (date.getTime() === today.getTime()) return 'today'
    if (date.getTime() === tomorrow.getTime()) return 'tomorrow'
    if (date <= thisWeekEnd) return 'this-week'
    if (date <= thisMonthEnd) return 'this-month'
    return 'later'
  }

  const grouped = {
    overdue: tasksByDueDate.filter(c => categorizeTask(c.dueDate!) === 'overdue'),
    today: tasksByDueDate.filter(c => categorizeTask(c.dueDate!) === 'today'),
    tomorrow: tasksByDueDate.filter(c => categorizeTask(c.dueDate!) === 'tomorrow'),
    'this-week': tasksByDueDate.filter(c => categorizeTask(c.dueDate!) === 'this-week'),
    'this-month': tasksByDueDate.filter(c => categorizeTask(c.dueDate!) === 'this-month'),
    later: tasksByDueDate.filter(c => categorizeTask(c.dueDate!) === 'later'),
  }

  const sections: Array<{ key: string; label: string; color: string; count: number }> = [
    { key: 'overdue', label: 'Overdue', color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', count: grouped.overdue.length },
    { key: 'today', label: 'Today', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', count: grouped.today.length },
    { key: 'tomorrow', label: 'Tomorrow', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800', count: grouped.tomorrow.length },
    { key: 'this-week', label: 'This Week', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', count: grouped['this-week'].length },
    { key: 'this-month', label: 'This Month', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', count: grouped['this-month'].length },
    { key: 'later', label: 'Later', color: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800', count: grouped.later.length },
  ]

  return (
    <div className="space-y-6">
      {sections.map(section => (
        grouped[section.key as keyof typeof grouped].length > 0 && (
          <div key={section.key} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {section.label} <span className="text-gray-500 dark:text-gray-400 font-normal">({section.count})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {grouped[section.key as keyof typeof grouped].map(card => (
                <Link
                  key={card.id}
                  href={`/board/${card.boardId}?cardId=${card.id}`}
                  className={`block p-3 rounded-lg border transition-colors ${section.color}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {card.title}
                      </h4>
                      {card.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                          {card.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {new Date(card.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      {card.labels.length > 0 && (
                        <div className="mt-1 flex gap-1 justify-end flex-wrap">
                          {card.labels.slice(0, 2).map(label => (
                            <span
                              key={label.id}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      ))}

      {tasksByDueDate.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12v6m0 0v6m0-6h6m0 0h6m0 0v-6m0 6V6m0 0h-6m0 0H6m0 0v6" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No tasks with due dates</p>
        </div>
      )}
    </div>
  )
}
