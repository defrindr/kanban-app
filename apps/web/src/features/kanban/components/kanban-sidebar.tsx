import type { Board, BoardMember } from '../types/kanban'

interface SidebarProps {
  boards: Board[]
  currentBoardId?: string
  onBoardSelect: (boardId: string) => void
  currentUser: BoardMember | null
}

export function Sidebar({ boards, currentBoardId, onBoardSelect, currentUser }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#1D2125] dark:bg-[#0D1117] text-white flex flex-col h-full">
      <div className="p-5 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
          <span className="font-semibold text-lg">KanbanPro</span>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
            Workspaces
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#E6F0FF] text-blue-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="font-medium">Product Board</span>
          </button>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
            Your Boards
          </div>
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => onBoardSelect(board.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                currentBoardId === board.id
                  ? 'bg-gray-700/50 text-white'
                  : 'text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <div
                className={`w-4 h-4 rounded ${
                  board.id === 'board-1'
                    ? 'bg-blue-500'
                    : board.id === 'board-2'
                    ? 'bg-purple-500'
                    : 'bg-orange-500'
                }`}
              />
              <span className="text-sm truncate">{board.name}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-gray-700/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xs font-medium">
            {currentUser?.avatar || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{currentUser?.name || 'User'}</div>
            <div className="text-xs text-gray-400">{currentUser?.email || 'user@company.com'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}