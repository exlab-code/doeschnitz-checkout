import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from '@/components/progress-bar'

describe('ProgressBar', () => {
  it('renders correct number of segments', () => {
    const { container } = render(<ProgressBar total={6} completed={2} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments).toHaveLength(6)
  })

  it('marks completed segments with data-filled="true"', () => {
    const { container } = render(<ProgressBar total={6} completed={3} />)
    const segments = container.querySelectorAll('[data-segment]')
    const filledSegments = Array.from(segments).filter(
      (s) => s.getAttribute('data-filled') === 'true'
    )
    const unfilledSegments = Array.from(segments).filter(
      (s) => s.getAttribute('data-filled') === 'false'
    )
    expect(filledSegments).toHaveLength(3)
    expect(unfilledSegments).toHaveLength(3)
  })

  it('marks first N segments as filled where N = completed', () => {
    const { container } = render(<ProgressBar total={4} completed={2} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments[0].getAttribute('data-filled')).toBe('true')
    expect(segments[1].getAttribute('data-filled')).toBe('true')
    expect(segments[2].getAttribute('data-filled')).toBe('false')
    expect(segments[3].getAttribute('data-filled')).toBe('false')
  })

  it('renders nothing when total is 0', () => {
    const { container } = render(<ProgressBar total={0} completed={0} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments).toHaveLength(0)
  })
})
