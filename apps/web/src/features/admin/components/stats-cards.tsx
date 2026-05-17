import { Users, Layout, List, Columns3, MessageSquareText } from 'lucide-react';
import { ADMIN_STAT_CARDS } from '@/lib/constants';
import type { AdminStats } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Layout,
  List,
  Columns3,
  MessageSquareText,
};

export function StatsCards({ stats }: { stats: AdminStats | null }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {ADMIN_STAT_CARDS.map((card) => {
        const Icon = ICON_MAP[card.icon];
        return (
          <div
            key={card.key}
            className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5"
          >
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white mb-3`}>
              {Icon && <Icon className="w-5 h-5" />}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats ? stats[card.key].toLocaleString() : '—'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
