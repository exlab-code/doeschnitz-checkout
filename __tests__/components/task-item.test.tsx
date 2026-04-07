import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TaskItem } from '@/components/task-item'
import type { Task } from '@/lib/types'

const task: Task = {
  id: 'task-1',
  title: 'Clean the kitchen',
  description: 'Wipe counters and clean the sink',
  media: [],
}

describe('TaskItem', () => {
  it('renders task title', () => {
    render(<TaskItem task={task} isCompleted={false} isExpanded={false} onToggle={vi.fn()} onTap={vi.fn()} />)
    expect(screen.getByText('Clean the kitchen')).toBeDefined()
  })

  it('shows description when expanded', () => {
    render(<TaskItem task={task} isCompleted={false} isExpanded={true} onToggle={vi.fn()} onTap={vi.fn()} />)
    expect(screen.getByText('Wipe counters and clean the sink')).toBeDefined()
  })

  it('does not show description when collapsed', () => {
    render(<TaskItem task={task} isCompleted={false} isExpanded={false} onToggle={vi.fn()} onTap={vi.fn()} />)
    expect(screen.queryByText('Wipe counters and clean the sink')).toBeNull()
  })

  it('shows strikethrough when completed', () => {
    const { container } = render(<TaskItem task={task} isCompleted={true} isExpanded={false} onToggle={vi.fn()} onTap={vi.fn()} />)
    const title = container.querySelector('.line-through')
    expect(title).not.toBeNull()
  })

  it('does not show strikethrough when not completed', () => {
    const { container } = render(<TaskItem task={task} isCompleted={false} isExpanded={true} onToggle={vi.fn()} onTap={vi.fn()} />)
    const title = container.querySelector('.line-through')
    expect(title).toBeNull()
  })

  it('calls onToggle when checkbox clicked', () => {
    const onToggle = vi.fn()
    render(<TaskItem task={task} isCompleted={false} isExpanded={false} onToggle={onToggle} onTap={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })

  it('calls onTap when task row clicked', () => {
    const onTap = vi.fn()
    render(<TaskItem task={task} isCompleted={false} isExpanded={false} onToggle={vi.fn()} onTap={onTap} />)
    fireEvent.click(screen.getByText('Clean the kitchen'))
    expect(onTap).toHaveBeenCalledWith('task-1')
  })

  it('checkbox is aria-checked true when completed', () => {
    render(<TaskItem task={task} isCompleted={true} isExpanded={false} onToggle={vi.fn()} onTap={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.getAttribute('aria-checked')).toBe('true')
  })

  it('checkbox is aria-checked false when not completed', () => {
    render(<TaskItem task={task} isCompleted={false} isExpanded={false} onToggle={vi.fn()} onTap={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.getAttribute('aria-checked')).toBe('false')
  })
})
