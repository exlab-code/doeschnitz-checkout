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

const taskWithMedia: Task = {
  ...task,
  media: [{ type: 'image', url: '/media/test.jpg', label: 'test' }],
}

describe('TaskItem', () => {
  it('renders task title', () => {
    render(<TaskItem task={task} isCompleted={false} onToggle={vi.fn()} onOpen={vi.fn()} />)
    expect(screen.getByText('Clean the kitchen')).toBeDefined()
  })

  it('shows strikethrough when completed', () => {
    const { container } = render(<TaskItem task={task} isCompleted={true} onToggle={vi.fn()} onOpen={vi.fn()} />)
    expect(container.querySelector('.line-through')).not.toBeNull()
  })

  it('does not show strikethrough when not completed', () => {
    const { container } = render(<TaskItem task={task} isCompleted={false} onToggle={vi.fn()} onOpen={vi.fn()} />)
    expect(container.querySelector('.line-through')).toBeNull()
  })

  it('calls onToggle when checkbox clicked', () => {
    const onToggle = vi.fn()
    render(<TaskItem task={task} isCompleted={false} onToggle={onToggle} onOpen={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })

  it('shows info pill when task has description', () => {
    render(<TaskItem task={task} isCompleted={false} onToggle={vi.fn()} onOpen={vi.fn()} />)
    expect(screen.getByText('info')).toBeDefined()
  })

  it('shows media count pill when task has media', () => {
    render(<TaskItem task={taskWithMedia} isCompleted={false} onToggle={vi.fn()} onOpen={vi.fn()} />)
    expect(screen.getByText('1 📷')).toBeDefined()
  })

  it('calls onOpen when pill clicked', () => {
    const onOpen = vi.fn()
    render(<TaskItem task={task} isCompleted={false} onToggle={vi.fn()} onOpen={onOpen} />)
    fireEvent.click(screen.getByText('info'))
    expect(onOpen).toHaveBeenCalledWith('task-1')
  })

  it('checkbox is aria-checked true when completed', () => {
    render(<TaskItem task={task} isCompleted={true} onToggle={vi.fn()} onOpen={vi.fn()} />)
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true')
  })
})
