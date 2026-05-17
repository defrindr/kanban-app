'use client'

import { Card } from '@/features/kanban/types/kanban'
import Link from 'next/link'

interface CalendarViewProps {
  cards: Card[]
}

export function CalendarView({ cards }: CalendarViewProps) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  // Create calendar grid
  const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  
  // Get tasks by due date
  const tasksByDate = new Map<number, Card[]>()
  cards.forEach(card => {
    if (card.dueDate) {
      const dueDate = new Date(card.dueDate)
      if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
        const day = dueDate.getDate()
        if (!tasksByDate.has(day)) tasksByDate.set(day, [])
        tasksByDate.get(day)!.push(card)
      }
    }
  })
  
  const taskCount = Array.from(tasksByDate.values()).reduce((sum, tasks) => sum + tasks.length, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{monthName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{taskCount} tasks due this month</p>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayTasks = day ? tasksByDate.get(day) || [] : []
          const isToday = day === currentDate.getDate()
          const isCurrentMonth = day !== null
          const isOverdue = day && new Date(currentYear, currentMonth, day) < new Date() && day !== currentDate.getDate()
          
          return (
            <div
              key={idx}
              className={`min-h-24 p-2 rounded-lg border transition-colors ${
                !isCurrentMonth
                  ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
                  : isToday
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : isOverdue
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {day && (
                <>
                  <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-blue-700 dark:text-blue-300' : isOverdue ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day}
                  </div>
                  {dayTasks.length > 0 && (
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map(card => (
                        <Link
                          key={card.id}
                          href={`/board/${card.boardId}?cardId=${card.id}`}
                          className="block text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 truncate transition-colors"
                          title={card.title}
                        >
                          {card.title}
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1.5 py-0.5">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
