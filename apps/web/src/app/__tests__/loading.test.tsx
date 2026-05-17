import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RootLoading from '../loading'

describe('RootLoading', () => {
  it('renders loading indicator', () => {
    render(<RootLoading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = render(<RootLoading />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
