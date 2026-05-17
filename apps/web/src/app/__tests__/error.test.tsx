import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RootError from '../error';

describe('RootError', () => {
  it('renders error message', () => {
    const error = new Error('Failed to load board');
    const reset = vi.fn();
    render(<RootError error={error} reset={reset} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to load board')).toBeInTheDocument();
  });

  it('shows generic message when no error message', () => {
    const error = new Error();
    const reset = vi.fn();
    render(<RootError error={error} reset={reset} />);
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('calls reset on button click', () => {
    const error = new Error('test');
    const reset = vi.fn();
    render(<RootError error={error} reset={reset} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('renders icon element', () => {
    const error = new Error('test');
    const reset = vi.fn();
    const { container } = render(<RootError error={error} reset={reset} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
