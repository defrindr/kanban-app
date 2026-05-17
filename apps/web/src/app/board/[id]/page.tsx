import { KanbanBoard } from '@/features/kanban/components/kanban-board'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BoardPage({ params }: Props) {
  const { id } = await params
  return <KanbanBoard boardId={id} />
}