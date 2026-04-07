import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaCard } from '@/components/area-card'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('AreaCard', () => {
  const defaultProps = {
    id: 'kitchen',
    name: 'Küche',
    emoji: '🍳',
    taskCount: 6,
    completedCount: 3,
  }

  it('renders area name and emoji', () => {
    render(<AreaCard {...defaultProps} />)
    expect(screen.getByText('🍳')).toBeDefined()
    expect(screen.getByText('Küche')).toBeDefined()
  })

  it('shows task count', () => {
    render(<AreaCard {...defaultProps} />)
    expect(screen.getByText('6 Aufgaben')).toBeDefined()
  })

  it('shows progress fraction when completedCount > 0', () => {
    render(<AreaCard {...defaultProps} />)
    expect(screen.getByText('3/6')).toBeDefined()
  })

  it('shows dash when completedCount is 0', () => {
    render(<AreaCard {...defaultProps} completedCount={0} />)
    expect(screen.getByText('—')).toBeDefined()
  })

  it('links to the area detail page', () => {
    render(<AreaCard {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/area/kitchen')
  })

  it('renders progress bar when taskCount > 0', () => {
    const { container } = render(<AreaCard {...defaultProps} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments.length).toBeGreaterThan(0)
  })

  it('does not render progress bar when taskCount is 0', () => {
    const { container } = render(<AreaCard {...defaultProps} taskCount={0} completedCount={0} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments).toHaveLength(0)
  })
})
