import { useState, useEffect } from 'react'
import type { Activity, Board, BoardMember } from '../types/kanban'

interface Props {
  activeTab: 'settings' | 'activity'
  onTabChange: (tab: 'settings' | 'activity') => void
  activities: Activity[]
  board?: Board | null
  onUpdateBoard?: (data: { name?: string; description?: string; visibility?: 'workspace' | 'private' | 'public' }) => void
  onAddMember?: (member: BoardMember) => void
  onRemoveMember?: (memberId: string) => void
  onDeleteBoard?: () => void
}

export function RightSidebar({ activeTab, onTabChange, activities, board, onUpdateBoard, onAddMember, onRemoveMember, onDeleteBoard }: Props) {
  const [boardName, setBoardName] = useState(board?.name || '')
  const [boardDesc, setBoardDesc] = useState(board?.description || '')
  const [visibility, setVisibility] = useState(board?.visibility || 'workspace')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')

  useEffect(() => {
    setBoardName(board?.name || '')
    setBoardDesc(board?.description || '')
    setVisibility(board?.visibility || 'workspace')
  }, [board?.name, board?.description, board?.visibility])

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('')
  }

  function handleSave() {
    onUpdateBoard?.({ name: boardName, description: boardDesc, visibility })
  }

  function handleAddMember() {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !board) return
    const avatar = newMemberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    onAddMember?.({ id: `member-${Date.now()}`, name: newMemberName.trim(), email: newMemberEmail.trim(), avatar })
    setNewMemberName(''); setNewMemberEmail('')
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button onClick={() => onTabChange('settings')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'settings' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Board Settings</button>
          <button onClick={() => onTabChange('activity')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'activity' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Activity</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'activity' ? (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Recent Activity</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400">No activity yet</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {activity.userAvatar || getInitials(activity.userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{activity.userName}</span>
                      <span className="text-gray-500 dark:text-gray-400"> {activity.action} </span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{activity.entityName}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Board Name</label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</label>
              <textarea
                value={boardDesc}
                onChange={(e) => setBoardDesc(e.target.value)}
                rows={3}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Visibility</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                <option value="workspace">Workspace visible</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
            <button onClick={handleSave} className="w-full py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">Save Changes</button>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
              <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Members ({board?.members.length || 0})</h4>
              <div className="space-y-1.5 mb-3">
                {board?.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg group">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium bg-gradient-to-br from-blue-400 to-blue-600">{m.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                    {onRemoveMember && board.ownerId !== m.id && (
                      <button onClick={() => onRemoveMember(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Name"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400" />
                <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="Email"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400" />
                <button onClick={handleAddMember} disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Add Member</button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700/50">
              <button onClick={onDeleteBoard} className="w-full py-2 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Delete Board
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}