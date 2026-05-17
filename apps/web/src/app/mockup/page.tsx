'use client';

import { useState, useEffect } from 'react';

interface BoardMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface Label {
  name: string;
  color: 'blue' | 'red' | 'purple' | 'green' | 'orange';
}

interface Card {
  id: string;
  title: string;
  labels: Label[];
  comments: number;
  assignee?: string;
}

interface List {
  id: string;
  title: string;
  cards: Card[];
}

interface Board {
  id: string;
  name: string;
  lists: List[];
}

interface Activity {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  to?: string;
  time: string;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  unread: boolean;
}

const mockMembers: BoardMember[] = [
  { id: '1', name: 'John Doe', avatar: 'JD', color: 'bg-blue-500' },
  { id: '2', name: 'Alice Rose', avatar: 'AR', color: 'bg-purple-500' },
  { id: '3', name: 'Mike Kim', avatar: 'MK', color: 'bg-orange-500' },
];

const mockBoards: Board[] = [
  { id: '1', name: 'Product Roadmap', lists: [] },
  { id: '2', name: 'Engineering Sprint', lists: [] },
  { id: '3', name: 'Marketing Campaign', lists: [] },
  { id: '4', name: 'Design System', lists: [] },
];

const mockLists: List[] = [
  { id: 'list-1', title: 'Backlog', cards: [] },
  { id: 'list-2', title: 'To Do', cards: [] },
  {
    id: 'list-3',
    title: 'In Progress',
    cards: [
      {
        id: 'card-1',
        title: 'Implement authentication flow',
        labels: [
          { name: 'Frontend', color: 'blue' },
          { name: 'Priority', color: 'red' },
        ],
        comments: 3,
        assignee: 'JD',
      },
      {
        id: 'card-2',
        title: 'Design system color palette',
        labels: [{ name: 'Design', color: 'purple' }],
        comments: 1,
        assignee: 'AR',
      },
      {
        id: 'card-3',
        title: 'API endpoint optimization',
        labels: [{ name: 'Backend', color: 'orange' }],
        comments: 0,
        assignee: undefined,
      },
    ],
  },
  {
    id: 'list-4',
    title: 'Review',
    cards: [
      {
        id: 'card-4',
        title: 'User testing feedback analysis',
        labels: [{ name: 'Research', color: 'green' }],
        comments: 5,
        assignee: 'MK',
      },
    ],
  },
  { id: 'list-5', title: 'Done', cards: [] },
];

const mockActivity: Activity[] = [
  {
    id: '1',
    user: 'John Doe',
    avatar: 'JD',
    action: 'moved',
    target: 'Authentication flow',
    to: 'In Progress',
    time: '2 min ago',
  },
  { id: '2', user: 'Alice Rose', avatar: 'AR', action: 'commented on', target: 'Design system', time: '15 min ago' },
  { id: '3', user: 'Mike Kim', avatar: 'MK', action: 'created', target: 'Mobile responsive fixes', time: '1 hour ago' },
  { id: '4', user: 'John Doe', avatar: 'JD', action: 'completed', target: 'API optimization', time: '3 hours ago' },
];

const mockNotifications: Notification[] = [
  { id: '1', message: 'Alice commented on your card', time: '5 min ago', unread: true },
  { id: '2', message: 'Mike mentioned you in Design System', time: '1 hour ago', unread: true },
  { id: '3', message: 'John moved your card to Done', time: '2 hours ago', unread: false },
];

const assigneeColors: Record<string, string> = {
  JD: 'bg-blue-500',
  AR: 'bg-purple-500',
  MK: 'bg-orange-500',
};

const labelColors: Record<Label['color'], string> = {
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
};

export default function MockupPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'activity'>('board');
  const [selectedCard, setSelectedCard] = useState<string | null>('card-1');

  useEffect(() => {
    const saved = localStorage.getItem('kanban-dark-mode');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('kanban-dark-mode', JSON.stringify(next));
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('');

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1D2125] dark:bg-[#0D1117] text-white flex flex-col">
          <div className="p-5 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="font-semibold text-lg">KanbanPro</span>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">Workspaces</div>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#E6F0FF] text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="font-medium">Product Board</span>
              </button>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">Your Boards</div>
              {mockBoards.slice(0, 3).map((board) => (
                <button
                  key={board.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800/50 transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded ${board.id === '1' ? 'bg-blue-500' : board.id === '2' ? 'bg-purple-500' : 'bg-orange-500'}`}
                  ></div>
                  <span className="text-sm truncate">{board.name}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="p-3 border-t border-gray-700/50">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xs font-medium">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">John Doe</div>
                <div className="text-xs text-gray-400">john@company.com</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-5 flex-shrink-0 transition-colors duration-200">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Product Board</h1>
              <div className="flex -space-x-2">
                {mockMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800`}
                    title={member.name}
                  >
                    {member.avatar}
                  </div>
                ))}
                <button className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-medium border-2 border-white dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  +2
                </button>
              </div>
              <span className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>5 online
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
              <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {mockNotifications.some((n) => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </header>

          {/* Board Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Kanban Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-5">
              <div className="flex gap-4 h-full">
                {mockLists.map((list) => (
                  <div
                    key={list.id}
                    className="w-72 flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex flex-col max-h-full transition-colors duration-200"
                  >
                    {/* List Header */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{list.title}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                          {list.cards.length || 3}
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto px-2 pb-2">
                      <div className="space-y-2">
                        {list.cards.map((card, idx) => (
                          <div
                            key={card.id}
                            onClick={() => setSelectedCard(card.id === selectedCard ? null : card.id)}
                            className={`
                              bg-white dark:bg-gray-800 rounded-lg p-3 cursor-pointer transition-all duration-200 
                              hover:shadow-md dark:hover:shadow-gray-900/50 
                              ${selectedCard === card.id ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm'}
                            `}
                          >
                            {card.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {card.labels.map((label, i) => (
                                  <span
                                    key={i}
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${labelColors[label.color]}`}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug mb-2">
                              {card.title}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {card.comments > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                      />
                                    </svg>
                                    {card.comments}
                                  </span>
                                )}
                              </div>
                              {card.assignee && (
                                <div
                                  className={`w-6 h-6 rounded-full ${assigneeColors[card.assignee]} flex items-center justify-center text-white text-[10px] font-medium`}
                                >
                                  {card.assignee}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {list.cards.length === 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-snug">
                              Sample card for {list.title}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Card */}
                    <div className="px-2 pb-3">
                      <button className="w-full py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-left pl-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add card
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add List Button */}
                <button className="w-72 flex-shrink-0 h-12 bg-white/50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add list
                </button>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('board')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'board' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    Board Settings
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'activity' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    Activity
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'activity' ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Recent Activity
                    </h3>
                    {mockActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {getInitials(activity.user)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            <span className="font-medium">{activity.user}</span>
                            <span className="text-gray-500 dark:text-gray-400"> {activity.action} </span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">{activity.target}</span>
                            {activity.to && <span className="text-gray-500 dark:text-gray-400"> to {activity.to}</span>}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Board Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Product Board"
                        className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Description
                      </label>
                      <textarea
                        defaultValue="Main product development board"
                        rows={3}
                        className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Visibility
                      </label>
                      <select className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        <option>Workspace visible</option>
                        <option>Private</option>
                        <option>Public</option>
                      </select>
                    </div>
                    <button className="w-full py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Card Detail Modal */}
        {selectedCard && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex gap-1 mb-3">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        Frontend
                      </span>
                      <span className="text-xs font-medium px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                        Priority
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Implement authentication flow
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    in list <span className="text-blue-600 dark:text-blue-400 font-medium">In Progress</span>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                      JD
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Assigned to <span className="font-medium text-gray-700 dark:text-gray-300">John Doe</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex flex-col lg:flex-row max-h-[calc(90vh-200px)] overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-6 border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Description</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      <p className="mb-3">Implement the complete authentication flow including:</p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Login page with email/password</li>
                        <li>Registration with email verification</li>
                        <li>Password reset functionality</li>
                        <li>Social login (Google, GitHub)</li>
                        <li>Session management</li>
                      </ul>
                      <p>
                        Use NextAuth.js with custom credentials provider. Make sure to implement proper error handling
                        and loading states.
                      </p>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Attachments</h3>
                    <div className="flex gap-2">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        Figma
                      </div>
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        PDF
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Checklist</h3>
                    <div className="space-y-2">
                      {[
                        'Setup NextAuth config',
                        'Create login page',
                        'Create register page',
                        'Implement JWT',
                        'Add session handling',
                      ].map((item, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            defaultChecked={i < 2}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                          />
                          <span
                            className={`text-sm ${i < 2 ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            {item}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Comments</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          AR
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Alice Rose</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">2 hours ago</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            The Figma mockups have been updated with the new design system components. Please check the
                            attachment.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          JD
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">John Doe</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">1 hour ago</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Thanks! I&apos;ll review the designs and start implementing. @Mike can you help with the
                            social login setup?
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        JD
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Write a comment..."
                          rows={2}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400 resize-none"
                        />
                        <button className="mt-2 px-4 py-1.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-56 p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                      Labels
                    </label>
                    <div className="space-y-1">
                      <button className="w-full text-left px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        Frontend
                      </button>
                      <button className="w-full text-left px-2 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                        Priority
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                      Assignees
                    </label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">
                          JD
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">John Doe</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      defaultValue="2026-05-25"
                      className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                      Priority
                    </label>
                    <select className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full text-left px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                      Delete card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
