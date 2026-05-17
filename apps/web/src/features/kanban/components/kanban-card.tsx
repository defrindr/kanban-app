'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../types/kanban'

interface KanbanCardProps {
  card: Card
  onClick: () => void
  isSelected?: boolean
  onUpdate?: (cardId: string, data: { title?: string }) => void
}

const labelColorMap: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

const coverColors: Record<string, string> = {
  blue: 'bg-blue-200/60 dark:bg-blue-800/30',
  purple: 'bg-purple-200/60 dark:bg-purple-800/30',
  green: 'bg-green-200/60 dark:bg-green-800/30',
  orange: 'bg-orange-200/60 dark:bg-orange-800/30',
  red: 'bg-red-200/60 dark:bg-red-800/30',
  gray: 'bg-gray-200/60 dark:bg-gray-700/50',
}

export function KanbanCard({ card, onClick, isSelected, onUpdate }: KanbanCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function handleBlur() {
    setEditing(false)
    if (title.trim() && title !== card.title) onUpdate?.(card.id, { title: title.trim() })
    else setTitle(card.title)
  }

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()
  const checklistTotal = card.checklist?.length || 0
  const checklistDone = card.checklist?.filter(i => i.done).length || 0

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className={`
          bg-white dark:bg-gray-800 rounded-xl transition-all duration-150 overflow-hidden cursor-pointer
          border border-gray-100 dark:border-gray-700/50
          hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md dark:hover:shadow-gray-900/40
          ${isSelected ? 'ring-2 ring-blue-500 shadow-md border-transparent' : 'shadow-sm'}
          ${isDragging ? 'opacity-50 shadow-lg rotate-[3deg]' : ''}
        `}
      >
        {card.coverColor && (
          <div className={`h-2 ${coverColors[card.coverColor] || ''}`} />
        )}

        <div className="p-3.5 space-y-2.5">
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.labels.map((label) => (
                <span key={label.id} className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${labelColorMap[label.color]}`}>{label.name}</span>
              ))}
            </div>
          )}

          {editing ? (
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              className="w-full text-sm font-semibold text-gray-800 dark:text-gray-200 bg-transparent border-b-2 border-blue-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug"
              onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
            >
              {card.title}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {(card.startDate || card.dueDate) && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${card.dueDate && new Date(card.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {card.startDate && card.dueDate ? (
                  <>
                    {new Date(card.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </>
                ) : card.dueDate ? (
                  <>
                    {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {isOverdue && ' • Overdue'}
                  </>
                ) : (
                  <>{new Date(card.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                )}
              </span>
            )}

            {checklistTotal > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.5l3 3 4-4" />
                </svg>
                <span className={`${checklistDone === checklistTotal ? 'text-green-500' : ''}`}>{checklistDone}/{checklistTotal}</span>
              </span>
            )}

            {card.comments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {card.comments.length}
              </span>
            )}

            {card.attachments && card.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {card.attachments.length}
              </span>
            )}

            <div className="flex-1" />

            {card.assignees[0] && (
              <div className="flex -space-x-1.5">
                {card.assignees.slice(0, 3).map((a) => (
                  <div key={a.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium ring-2 ring-white dark:ring-gray-800 ${a.avatar === 'JD' ? 'bg-blue-500' : a.avatar === 'AR' ? 'bg-purple-500' : a.avatar === 'MK' ? 'bg-orange-500' : 'bg-green-500'}`}>
                    {a.avatar}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}