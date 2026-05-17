import { useState } from 'react';
import { BOARD_TEMPLATES } from '../types/kanban';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, template?: string) => void;
}

export function NewBoardModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<string | undefined>(undefined);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), template);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Board</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Board name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="e.g., Product Roadmap"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
              placeholder="What's this board about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplate(undefined)}
                className={`p-3 rounded-xl border text-left transition-all ${!template ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
              >
                <div className="flex gap-1 mb-2">
                  {['bg-blue-500', 'bg-purple-500', 'bg-green-500'].map((c) => (
                    <div key={c} className={`w-2 h-2 rounded-full ${c}`} />
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Blank</p>
                <p className="text-xs text-gray-400 mt-0.5">Start from scratch</p>
              </button>
              {BOARD_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setTemplate(t.name)}
                  className={`p-3 rounded-xl border text-left transition-all ${template === t.name ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
                >
                  <div className="flex gap-1 mb-2">
                    {t.name === 'Bug Tracker'
                      ? ['bg-red-500', 'bg-orange-500', 'bg-green-500'].map((c) => (
                          <div key={c} className={`w-2 h-2 rounded-full ${c}`} />
                        ))
                      : ['bg-blue-500', 'bg-purple-500', 'bg-green-500'].map((c) => (
                          <div key={c} className={`w-2 h-2 rounded-full ${c}`} />
                        ))}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
