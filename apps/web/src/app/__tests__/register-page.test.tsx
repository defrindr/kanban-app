import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from '../register/page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));

const mockRegister = vi.fn();
const mockLoginWithGoogle = vi.fn();

vi.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector?: any) => {
      const state = { user: null, isLoading: false, register: mockRegister, loginWithGoogle: mockLoginWithGoogle };
      return selector ? selector(state) : state;
    },
    { setState: vi.fn(), getState: () => ({ user: null, isLoading: false }) }
  ),
}));

describe('RegisterPage', () => {
  it('renders registration form', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 8 characters')).toBeInTheDocument();
  });

  it('renders Google sign up button', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Sign up with Google')).toBeInTheDocument();
  });

  it('renders sign in link', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('calls register on form submit', async () => {
    mockRegister.mockResolvedValueOnce(true);
    render(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'j@t.com' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(mockRegister).toHaveBeenCalledWith('John', 'j@t.com', 'password123');
  });

  it('redirects to dashboard on success', async () => {
    mockRegister.mockResolvedValueOnce(true);
    render(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'j@t.com' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error on failed registration', async () => {
    mockRegister.mockResolvedValueOnce(false);
    render(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'j@t.com' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await vi.waitFor(() => expect(screen.getByText('Registration failed')).toBeInTheDocument());
  });

  it('shows hero section', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Join thousands of teams')).toBeInTheDocument();
  });
});
