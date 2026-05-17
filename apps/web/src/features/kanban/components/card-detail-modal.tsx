'use client'

import { useState, useRef } from 'react'
import type { Card, Label, BoardMember } from '../types/kanban'
import { LABEL_OPTIONS } from '../types/kanban'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const labelColorMap: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

const coverColors = [
  { name: 'None', value: '' },
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Green', value: 'green' },
  { name: 'Orange', value: 'orange' },
  { name: 'Red', value: 'red' },
]

interface Props {
  card: Card | null
  onClose: () => void
  onAddComment: (cardId: string, content: string) => void
  onUpdateCard?: (cardId: string, data: Record<string, unknown>) => void
  onToggleLabel?: (cardId: string, label: Label, add: boolean) => void
  onDeleteCard?: (cardId: string) => void
  onAddAttachment?: (cardId: string, file: File) => void
  onAddAssignee?: (cardId: string, member: BoardMember) => void
  onRemoveAssignee?: (cardId: string, memberId: string) => void
  boardMembers?: BoardMember[]
}

export function CardDetailModal({ card, onClose, onAddComment, onUpdateCard, onToggleLabel, onDeleteCard, onAddAttachment, onAddAssignee, onRemoveAssignee, boardMembers }: Props) {
  const [newComment, setNewComment] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [showLabels, setShowLabels] = useState(false)
  const [showCover, setShowCover] = useState(false)
  const [checklistText, setChecklistText] = useState('')
  const [showAttachForm, setShowAttachForm] = useState(false)
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!card) return null

  const handleComment = () => {
    if (!newComment.trim()) return
    onAddComment(card.id, newComment); setNewComment('')
  }

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== card.title) onUpdateCard?.(card.id, { title: editTitle.trim() })
    setEditingTitle(false)
  }

  const handleSaveDesc = () => {
    if (editDesc !== (card.description || '')) onUpdateCard?.(card.id, { description: editDesc || '' })
    setEditingDesc(false)
  }

  const handleAddChecklist = () => {
    if (!checklistText.trim()) return
    const item = { id: `check-${Date.now()}`, text: checklistText.trim(), done: false }
    const updated = [...(card.checklist || []), item]
    onUpdateCard?.(card.id, { checklist: updated })
    setChecklistText('')
  }

  const handleSaveDueDate = (date: string | null) => {
    onUpdateCard?.(card.id, { dueDate: date })
  }

  const handleSaveCover = (color: string | null) => {
    onUpdateCard?.(card.id, { coverColor: color })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { onAddAttachment?.(card.id, file); setShowAttachForm(false) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()
  const checklistTotal = card.checklist?.length || 0
  const checklistDone = card.checklist?.filter(i => i.done).length || 0

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-3xl sm:rounded-2xl max-h-[100vh] sm:max-h-[88vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Cover */}
        {card.coverColor && (
          <div className={`h-10 sm:h-14 flex-shrink-0 ${card.coverColor === 'blue' ? 'bg-blue-400/40 dark:bg-blue-700/30' : card.coverColor === 'purple' ? 'bg-purple-400/40 dark:bg-purple-700/30' : card.coverColor === 'green' ? 'bg-green-400/40 dark:bg-green-700/30' : card.coverColor === 'orange' ? 'bg-orange-400/40 dark:bg-orange-700/30' : card.coverColor === 'red' ? 'bg-red-400/40 dark:bg-red-700/30' : 'bg-gray-300/40 dark:bg-gray-600/30'}`} />
        )}

        {/* Header */}
        <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {card.labels.map((l) => (
                    <span key={l.id} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${labelColorMap[l.color]}`}>{l.name}</span>
                  ))}
                </div>
              )}
              {editingTitle ? (
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={handleSaveTitle} onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="w-full text-lg sm:text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none" autoFocus />
              ) : (
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => { setEditingTitle(true); setEditTitle(card.title) }}>{card.title}</h2>
              )}
            </div>
            <div className="flex items-center gap-1 ml-3 flex-shrink-0">
              <button onClick={() => onUpdateCard?.(card.id, { archived: !card.archived })} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title={card.archived ? 'Restore' : 'Archive'}>
                {card.archived ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                )}
              </button>
              <button onClick={() => setShowCover(!showCover)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Cover color">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {showCover && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Cover:</span>
              {coverColors.map((c) => (
                <button key={c.value} onClick={() => { onUpdateCard?.(card.id, { coverColor: c.value || null }); setShowCover(false) }}
                  className={`w-7 h-7 rounded-full ${c.value === 'blue' ? 'bg-blue-400' : c.value === 'purple' ? 'bg-purple-400' : c.value === 'green' ? 'bg-green-400' : c.value === 'orange' ? 'bg-orange-400' : c.value === 'red' ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-600'} border-2 ${card.coverColor === c.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'} transition-all hover:scale-110`} title={c.name}>
                  {!c.value && <svg className="w-3 h-3 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            {/* Main content */}
            <div className="flex-1 p-5 sm:p-7 space-y-6">
              {isOverdue && card.dueDate && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Overdue — was due {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                </div>
              )}

              {/* Due Date */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Due Date</h4>
                <div className="flex items-center gap-2">
                  <input type="date" value={card.dueDate ? card.dueDate.split('T')[0] : ''}
                    onChange={(e) => onUpdateCard?.(card.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:[color-scheme:dark]" />
                  {card.dueDate && (
                    <button onClick={() => onUpdateCard?.(card.id, { dueDate: null })} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</h4>
                  {!editingDesc && (
                    <button onClick={() => { setEditingDesc(true); setEditDesc(card.description || '') }} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {card.description ? 'Edit' : 'Add'}
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <div>
                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4}
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none" autoFocus />
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSaveDesc} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">Save</button>
                      <button onClick={() => setEditingDesc(false)} className="px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed cursor-pointer" onClick={() => { setEditingDesc(true); setEditDesc(card.description || '') }}>
                    {card.description || <span className="text-gray-400 italic">Add a more detailed description...</span>}
                  </p>
                )}
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Checklist</h4>
                  {checklistTotal > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{checklistDone}/{checklistTotal} done</span>
                  )}
                </div>
                {checklistTotal > 0 && (
                  <div className="mb-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${(checklistDone / checklistTotal) * 100}%` }} />
                  </div>
                )}
                <div className="space-y-1.5 mb-3">
                  {(card.checklist || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 px-0.5 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-md transition-colors group">
                      <input type="checkbox" checked={item.done} onChange={(e) => {
                        const updated = (card.checklist || []).map((ci) => ci.id === item.id ? { ...ci, done: e.target.checked } : ci)
                        onUpdateCard?.(card.id, { checklist: updated })
                      }}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      <span className={`text-sm flex-1 ${item.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={checklistText} onChange={(e) => setChecklistText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                    placeholder="Add checklist item..."
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400" />
                  <button onClick={handleAddChecklist} disabled={!checklistText.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">Add</button>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Attachments</h4>
                  <button onClick={() => setShowAttachForm(!showAttachForm)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">{showAttachForm ? 'Cancel' : 'Add'}</button>
                </div>
                {(card.attachments || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {(card.attachments || []).map((att) => (
                      <a key={att.id} href={att.url.startsWith('/uploads') ? API_URL + att.url : att.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{att.name}</span>
                      </a>
                    ))}
                  </div>
                )}
                {showAttachForm && (
                  <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-lg">
                    <input ref={fileInputRef} type="file" onChange={handleFileChange}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30" />
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Comments ({card.comments.length})</h4>
                <div className="space-y-4 mb-4">
                  {card.comments.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No comments yet</p>
                  )}
                  {card.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {comment.userAvatar || comment.userName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.userName}</span>
                          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">JD</div>
                  <div className="flex-1">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows={2}
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400 resize-none" />
                    <button onClick={handleComment} disabled={!newComment.trim()}
                      className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Comment</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-60 p-5 sm:p-7 lg:p-6 lg:border-l border-gray-100 dark:border-gray-700/50 space-y-5 bg-gray-50/50 dark:bg-gray-800/30">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Labels</h4>
                {showLabels ? (
                  <div className="flex flex-wrap gap-1.5">
                    {LABEL_OPTIONS.map((l) => {
                      const active = card.labels.some((cl) => cl.id === l.name)
                      return (
                        <button key={l.name} onClick={() => {
                            const isActive = card.labels.some((cl) => cl.id === l.name)
                            onToggleLabel?.(card.id, { id: l.name, name: l.name, color: l.color }, !isActive)
                          }}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${active ? labelColorMap[l.color] + ' ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{l.name}</button>
                      )
                    })}
                  </div>
                ) : (
                  <div>
                    {card.labels.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">No labels</p>
                    ) : (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map((l) => (
                          <span key={l.id} className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${labelColorMap[l.color]}`}>{l.name}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setShowLabels(true)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mt-1">Edit</button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Assignees</h4>
                {card.assignees.length > 0 ? (
                  <div className="space-y-1.5 mb-2">
                    {card.assignees.map((a) => (
                      <div key={a.id} className="flex items-center gap-2.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg group">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium bg-gradient-to-br from-blue-400 to-blue-600">{a.avatar}</div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium flex-1">{a.name}</span>
                        {onRemoveAssignee && (
                          <button onClick={() => onRemoveAssignee(card.id, a.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-2">No assignees</p>
                )}
                {showAssigneePicker && boardMembers ? (
                  <div className="space-y-0.5">
                    {boardMembers.filter(m => !card.assignees.some(a => a.id === m.id)).map((m) => (
                      <button key={m.id} onClick={() => { onAddAssignee?.(card.id, m); setShowAssigneePicker(false) }}
                        className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium bg-gradient-to-br from-gray-400 to-gray-500">{m.avatar}</div>
                        <span>{m.name}</span>
                      </button>
                    ))}
                    {boardMembers.every(m => card.assignees.some(a => a.id === m.id)) && (
                      <p className="text-xs text-gray-400 italic">All members assigned</p>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setShowAssigneePicker(true)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <button onClick={() => { onDeleteCard?.(card.id); onClose() }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete card
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}