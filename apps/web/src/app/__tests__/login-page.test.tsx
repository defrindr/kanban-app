import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from '../login/page'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))

vi.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector?: any) => {
      const state = { user: null, isLoading: false, login: mockLogin, loginWithGoogle: mockLoginWithGoogle }
      return selector ? selector(state) : state
    },
    { setState: vi.fn(), getState: () => ({ user: null, isLoading: false }) },
  ),
}))

const mockLogin = vi.fn()
const mockLoginWithGoogle = vi.fn()

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form', () => {
    render(<LoginPage />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('renders Google button', () => {
    render(<LoginPage />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('renders sign up link', () => {
    render(<LoginPage />)
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValueOnce(true)
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'pass' } })
    fireEvent.click(screen.getByText('Sign in'))
    expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'pass')
  })

  it('redirects to dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(true)
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign in'))
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows error on failed login', async () => {
    mockLogin.mockResolvedValueOnce(false)
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign in'))
    await vi.waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument())
  })

  it('shows Google not available error', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce(false)
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    await vi.waitFor(() => expect(screen.getByText('Google login is not available yet')).toBeInTheDocument())
  })

  it('shows hero section on large screens', () => {
    render(<LoginPage />)
    expect(screen.getByText('Collaborate better with KanbanPro')).toBeInTheDocument()
  })

  it('has pre-filled demo credentials', () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('you@company.com') as HTMLInputElement
    expect(emailInput.value).toBe('demo@kanbanpro.com')
  })
})
