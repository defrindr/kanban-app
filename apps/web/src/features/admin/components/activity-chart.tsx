'use client';

import { DailyActivityMetric } from '../types';

interface ActivityChartProps {
  data: DailyActivityMetric[];
  metric: 'cardCreated' | 'cardCompleted' | 'commentAdded' | 'userActive';
  title: string;
  color: string;
}

export function ActivityChart({ data, metric, title, color }: ActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-400">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d[metric]));
  const chartHeight = 200;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="flex items-end justify-between gap-1 h-64">
        {data.map((d, i) => {
          const height = maxValue > 0 ? (d[metric] / maxValue) * chartHeight : 0;
          const date = new Date(d.date);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full flex items-end justify-center h-40">
                <div
                  className={`w-full ${color} rounded-t opacity-80 hover:opacity-100 transition-opacity group-hover:shadow-lg`}
                  style={{ height: `${Math.max(height, 4)}px` }}
                  title={`${label}: ${d[metric]}`}
                />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center truncate w-full">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>Total: {data.reduce((sum, d) => sum + d[metric], 0)}</span>
        <span>Avg: {Math.round(data.reduce((sum, d) => sum + d[metric], 0) / data.length)}</span>
      </div>
    </div>
  );
}
