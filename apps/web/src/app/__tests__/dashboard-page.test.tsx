import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DashboardPage from '../dashboard/page'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))

const mockBoards: any[] = []

vi.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector?: any) => {
      const state = { user: { id: 'u1', name: 'John', email: 'john@test.com', avatar: 'JD' }, isLoading: false }
      return selector ? selector(state) : state
    },
    { setState: vi.fn(), getState: () => ({ checkAuth: vi.fn() }) },
  ),
}))

vi.mock('@/features/kanban/stores/board-store', () => ({
  useBoardStore: Object.assign(
    (selector?: any) => {
      const state = { boards: mockBoards, setBoards: vi.fn(), addBoard: vi.fn() }
      return selector ? selector(state) : state
    },
    { setState: vi.fn(), getState: () => ({ boards: mockBoards, addBoard: vi.fn() }) },
  ),
}))

vi.mock('@/features/kanban/api/mock-api', () => ({
  fetchBoards: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  createBoard: vi.fn().mockResolvedValue({ ok: true, data: { id: 'b-new', name: 'New Board', lists: [], members: [] } }),
}))

vi.mock('@/features/kanban/components/new-board-modal', () => ({
  NewBoardModal: ({ open, onClose, onCreate }: any) => open ? (
    <div data-testid="new-board-modal">
      <button onClick={() => onCreate('My Board', 'desc', 'Sprint Board')}>Create Test Board</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))

vi.mock('@/shared/hooks/use-dark-mode', () => ({
  useDarkMode: () => ({ darkMode: false, setDarkMode: vi.fn() }),
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBoards.length = 0
  })

  it('renders dashboard for authenticated user', async () => {
    render(<DashboardPage />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(await screen.findByText('Your Boards')).toBeInTheDocument()
  })

  it('renders user info', () => {
    render(<DashboardPage />)
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getAllByText('john@test.com').length).toBeGreaterThan(0)
  })

  it('shows board count', async () => {
    mockBoards.push(
      { id: 'b1', name: 'Board 1', lists: [], members: [], description: '' },
      { id: 'b2', name: 'Board 2', lists: [], members: [], description: '' },
    )
    render(<DashboardPage />)
    expect(await screen.findByText('2 boards')).toBeInTheDocument()
  })

  it('renders board cards', async () => {
    mockBoards.push({ id: 'b1', name: 'My Board', lists: [{ cards: [{}] }], members: [{}, {}], description: 'A board' })
    render(<DashboardPage />)
    expect(await screen.findByText('My Board')).toBeInTheDocument()
    expect(screen.getByText('1 cards')).toBeInTheDocument()
    expect(screen.getByText('2 members')).toBeInTheDocument()
  })

  it('shows description fallback', async () => {
    mockBoards.push({ id: 'b1', name: 'Board 1', lists: [], members: [], description: '' })
    render(<DashboardPage />)
    expect(await screen.findByText('No description')).toBeInTheDocument()
  })

  it('opens new board modal', () => {
    render(<DashboardPage />)
    const newBtns = screen.getAllByText('New Board')
    fireEvent.click(newBtns[newBtns.length - 1])
    expect(screen.getByTestId('new-board-modal')).toBeInTheDocument()
  })

  it('creates board and redirects', async () => {
    const addBoard = vi.fn()
    vi.mocked(vi.fn()).mockRestore()
    render(<DashboardPage />)
    const newBtns = screen.getAllByText('New Board')
    fireEvent.click(newBtns[newBtns.length - 1])
    fireEvent.click(screen.getByText('Create Test Board'))
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalled())
  })

  it('renders sidebar', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Product Workspace')).toBeInTheDocument()
    expect(screen.getByText('Boards')).toBeInTheDocument()
  })
})
