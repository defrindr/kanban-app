import { Users, Layout, List, Columns3, MessageSquareText } from 'lucide-react'
import type { AdminStats } from '../types'

const cards = [
  { key: 'users' as const, label: 'Total Users', color: 'bg-blue-500', Icon: Users },
  { key: 'boards' as const, label: 'Total Boards', color: 'bg-purple-500', Icon: Layout },
  { key: 'lists' as const, label: 'Total Lists', color: 'bg-green-500', Icon: List },
  { key: 'cards' as const, label: 'Total Cards', color: 'bg-orange-500', Icon: Columns3 },
  { key: 'comments' as const, label: 'Total Comments', color: 'bg-pink-500', Icon: MessageSquareText },
]

export function StatsCards({ stats }: { stats: AdminStats | null }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.key} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
          <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center text-white mb-3`}>
            <c.Icon className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats ? stats[c.key].toLocaleString() : '—'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
