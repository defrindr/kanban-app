import { useState, useEffect } from 'react';
import type { Activity, Board, BoardMember } from '../types/kanban';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

interface Props {
  activeTab: 'settings' | 'activity' | 'webhooks';
  onTabChange: (tab: 'settings' | 'activity' | 'webhooks') => void;
  activities: Activity[];
  board?: Board | null;
  onUpdateBoard?: (data: {
    name?: string;
    description?: string;
    visibility?: 'workspace' | 'private' | 'public';
  }) => void;
  onAddMember?: (member: BoardMember) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberRole?: (memberId: string, role: 'ADMIN' | 'MEMBER') => void;
  onDeleteBoard?: () => void;
  webhooks?: Webhook[];
  onCreateWebhook?: (url: string, events: string[]) => void;
  onUpdateWebhook?: (webhookId: string, data: { url?: string; events?: string[]; active?: boolean }) => void;
  onDeleteWebhook?: (webhookId: string) => void;
}

const avatarGradients = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-emerald-600',
  'from-orange-400 to-red-500',
  'from-pink-400 to-rose-600',
  'from-teal-400 to-cyan-600',
];

function getAvatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

export function RightSidebar({
  activeTab,
  onTabChange,
  activities,
  board,
  onUpdateBoard,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onDeleteBoard,
  webhooks = [],
  onCreateWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
}: Props) {
  const [boardName, setBoardName] = useState(board?.name || '');
  const [boardDesc, setBoardDesc] = useState(board?.description || '');
  const [visibility, setVisibility] = useState(board?.visibility || 'workspace');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['card:created', 'card:updated']);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);

  useEffect(() => {
    setBoardName(board?.name || '');
    setBoardDesc(board?.description || '');
    setVisibility(board?.visibility || 'workspace');
  }, [board?.name, board?.description, board?.visibility]);

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function formatActivity(a: Activity): string {
    const name = a.entityName || a.entityType;
    switch (a.action) {
      case 'created':
        return a.entityType === 'comment' ? `commented on ${name}` : `created ${a.entityType} "${name}"`;
      case 'moved':
        return `moved "${name}" from "${a.fromListTitle || a.fromListId || '?'}" to "${a.toListTitle || a.toListId || '?'}"`;
      case 'updated':
        return a.entityType === 'comment' ? 'updated a comment' : `updated ${a.entityType} "${name}"`;
      case 'deleted':
        return a.entityType === 'comment' ? 'deleted a comment' : `deleted ${a.entityType} "${name}"`;
      default:
        return a.action;
    }
  }

  function handleSave() {
    onUpdateBoard?.({ name: boardName, description: boardDesc, visibility });
  }

  function handleAddMember() {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !board) return;
    onAddMember?.({
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      avatar: getInitials(newMemberName),
      role: 'MEMBER',
    });
    setNewMemberName('');
    setNewMemberEmail('');
  }

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex text-xs">
          <button
            onClick={() => onTabChange('settings')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === 'settings' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Settings
          </button>
          <button
            onClick={() => onTabChange('webhooks')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === 'webhooks' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Webhooks
          </button>
          <button
            onClick={() => onTabChange('activity')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === 'activity' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Activity
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'activity' ? (
          <div className="space-y-1">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center pt-8">No activity yet</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(activity.userId || activity.id)} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                  >
                    {activity.userAvatar || getInitials(activity.userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{activity.userName}</span>
                      <span className="text-gray-500 dark:text-gray-400"> {formatActivity(activity)}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'webhooks' ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                Webhooks ({webhooks.length})
              </h4>
              <div className="space-y-2 mb-4">
                {webhooks.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No webhooks configured</p>
                ) : (
                  webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0 flex-1">
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{webhook.url}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {webhook.events.map((evt) => (
                              <span
                                key={evt}
                                className="inline-block text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                              >
                                {evt}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={webhook.active}
                                onChange={(e) => onUpdateWebhook?.(webhook.id, { active: e.target.checked })}
                                className="w-3 h-3"
                              />
                              <span>Active</span>
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteWebhook?.(webhook.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5 flex-shrink-0"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                Add Webhook
              </h5>
              <div className="space-y-2">
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="Webhook URL"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
                />
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">Events</label>
                  <div className="space-y-1">
                    {[
                      'card:created',
                      'card:updated',
                      'card:deleted',
                      'card:moved',
                      'list:created',
                      'list:updated',
                      'list:deleted',
                      'comment:created',
                      'comment:updated',
                      'comment:deleted',
                    ].map((evt) => (
                      <label
                        key={evt}
                        className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newWebhookEvents.includes(evt)}
                          onChange={(e) => {
                            setNewWebhookEvents(
                              e.target.checked ? [...newWebhookEvents, evt] : newWebhookEvents.filter((x) => x !== evt)
                            );
                          }}
                          className="w-3 h-3"
                        />
                        <span>{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (newWebhookUrl.trim() && newWebhookEvents.length > 0) {
                      onCreateWebhook?.(newWebhookUrl.trim(), newWebhookEvents);
                      setNewWebhookUrl('');
                      setNewWebhookEvents(['card:created', 'card:updated']);
                    }
                  }}
                  disabled={!newWebhookUrl.trim() || newWebhookEvents.length === 0}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Create Webhook
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Board Name
              </label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={boardDesc}
                onChange={(e) => setBoardDesc(e.target.value)}
                rows={3}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="workspace">Workspace visible</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
            <button
              onClick={handleSave}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                Members ({board?.members.length || 0})
              </h4>
              <div className="space-y-1 mb-3">
                {board?.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(m.id)} flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0`}
                    >
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {board.ownerId !== m.id && onUpdateMemberRole && (
                        <select
                          value={m.role || 'MEMBER'}
                          onChange={(e) => onUpdateMemberRole(m.id, e.target.value as 'ADMIN' | 'MEMBER')}
                          className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                      {board.ownerId === m.id && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-medium">
                          Owner
                        </span>
                      )}
                      {onRemoveMember && board.ownerId !== m.id && (
                        <button
                          onClick={() => onRemoveMember(m.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
                />
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Add Member
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onDeleteBoard}
                className="w-full py-2 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                Delete Board
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
