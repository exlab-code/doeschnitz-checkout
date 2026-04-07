'use client'

import type { Task } from '@/lib/types'

interface TaskItemProps {
  task: Task
  isCompleted: boolean
  onToggle: (taskId: string) => void
  onOpen: (taskId: string) => void
}

export function TaskItem({ task, isCompleted, onToggle, onOpen }: TaskItemProps) {
  const hasInfo = task.description || task.media.length > 0

  return (
    <div
      className={`p-3 ${
        isCompleted
          ? 'border border-gray-200 bg-gray-50'
          : 'border border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          role="checkbox"
          aria-checked={isCompleted}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(task.id)
          }}
          className={`w-7 h-7 border-2 flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px] ${
            isCompleted
              ? 'bg-black border-black text-white'
              : 'border-black'
          }`}
        >
          {isCompleted && <span className="text-xs leading-none">✓</span>}
        </button>
        <span
          className={`text-sm font-semibold flex-1 ${
            isCompleted ? 'line-through text-gray-400' : 'text-black'
          } ${hasInfo ? 'cursor-pointer' : ''}`}
          onClick={() => hasInfo && onOpen(task.id)}
        >
          {task.title}
        </span>
        {hasInfo && (
          <button
            onClick={() => onOpen(task.id)}
            className="text-xs text-gray-400 border border-gray-300 px-2.5 shrink-0 hover:border-gray-500 hover:text-gray-600 min-h-[44px] flex items-center"
          >
            {task.media.length > 0 ? `${task.media.length} 📷` : 'info'}
          </button>
        )}
      </div>
    </div>
  )
}
