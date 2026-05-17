import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NewBoardModal } from '../new-board-modal'

const LABEL = { name: 'Product Roadmap', description: 'Plan and track product features' }

describe('NewBoardModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<NewBoardModal open={false} onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders form when open', () => {
    render(<NewBoardModal open={true} onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByText('Board name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Product Roadmap')).toBeInTheDocument()
    expect(screen.getByText('Blank')).toBeInTheDocument()
  })

  function submitBtn() { return screen.getByRole('button', { name: 'Create Board' }) }

  it('calls onCreate with name and description', () => {
    const onCreate = vi.fn()
    render(<NewBoardModal open={true} onClose={vi.fn()} onCreate={onCreate} />)
    fireEvent.change(screen.getByPlaceholderText('e.g., Product Roadmap'), { target: { value: 'My Board' } })
    fireEvent.change(screen.getByPlaceholderText("What's this board about?"), { target: { value: 'A test board' } })
    fireEvent.click(submitBtn())
    expect(onCreate).toHaveBeenCalledWith('My Board', 'A test board', undefined)
  })

  it('does not call onCreate with empty name', () => {
    const onCreate = vi.fn()
    render(<NewBoardModal open={true} onClose={vi.fn()} onCreate={onCreate} />)
    fireEvent.click(submitBtn())
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('selects a template', () => {
    render(<NewBoardModal open={true} onClose={vi.fn()} onCreate={vi.fn()} />)
    fireEvent.click(screen.getByText(LABEL.name))
    expect(screen.getByText(LABEL.description)).toBeInTheDocument()
  })

  it('calls onCreate with template', () => {
    const onCreate = vi.fn()
    render(<NewBoardModal open={true} onClose={vi.fn()} onCreate={onCreate} />)
    fireEvent.change(screen.getByPlaceholderText('e.g., Product Roadmap'), { target: { value: 'Sprint' } })
    fireEvent.click(screen.getByText(LABEL.name))
    fireEvent.click(submitBtn())
    expect(onCreate).toHaveBeenCalledWith('Sprint', '', LABEL.name)
  })

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(<NewBoardModal open={true} onClose={onClose} onCreate={vi.fn()} />)
    fireEvent.click(container.firstChild!)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking X', () => {
    const onClose = vi.fn()
    render(<NewBoardModal open={true} onClose={onClose} onCreate={vi.fn()} />)
    const closeBtn = screen.getAllByRole('button').find(b => b.querySelector('svg'))
    fireEvent.click(closeBtn!)
    expect(onClose).toHaveBeenCalled()
  })

  it('disables submit when name is empty', () => {
    render(<NewBoardModal open={true} onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(submitBtn()).toBeDisabled()
  })
})
