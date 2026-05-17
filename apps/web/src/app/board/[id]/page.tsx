'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { KanbanBoard } from '@/features/kanban/components/kanban-board';

interface Props {
  params: Promise<{ id: string }>;
}

export default function BoardPage({ params }: Props) {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [boardId, setBoardId] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then(({ id }) => setBoardId(id));
  }, [params]);

  // Check auth on mount
  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && mounted && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router, mounted]);

  if (!mounted || isLoading || !user || !boardId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400">Loading board...</p>
        </div>
      </div>
    );
  }

  return <KanbanBoard boardId={boardId} />;
}
