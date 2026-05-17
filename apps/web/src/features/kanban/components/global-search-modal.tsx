'use client';

import { useEffect, useState } from 'react';
import { searchGlobally } from '../api/mock-api';

interface SearchResult {
  id: string;
  type: 'board' | 'list' | 'card' | 'comment';
  title: string;
  description?: string;
  boardId?: string;
  listId?: string;
  cardId?: string;
  boardName?: string;
  listName?: string;
  cardTitle?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard?: (cardId: string, boardId: string) => void;
  boardId?: string;
}

export function GlobalSearchModal({ isOpen, onClose, onSelectCard, boardId }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'card' | 'board' | 'list' | 'comment'>('all');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const type = searchType === 'all' ? undefined : (searchType as 'board' | 'list' | 'card' | 'comment');
        const res = await searchGlobally(query, type, 1, 20);
        if (res.ok) {
          setResults(res.data);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, searchType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards, lists, cards, comments..."
              className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {(['all', 'card', 'board', 'list', 'comment'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  searchType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
              {query ? 'No results found' : 'Start typing to search...'}
            </p>
          ) : (
            <div className="space-y-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    if (result.type === 'card' && result.boardId) {
                      onSelectCard?.(result.id, result.boardId);
                    }
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{result.title}</p>
                    {result.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{result.description}</p>
                    )}
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="inline-block text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {result.type}
                      </span>
                      {result.boardName && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
                          {result.boardName}
                        </span>
                      )}
                      {result.listName && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded">
                          {result.listName}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 font-mono">
              Esc
            </kbd>{' '}
            to close
          </span>
          {results.length > 0 && (
            <span>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
