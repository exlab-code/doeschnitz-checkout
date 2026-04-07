'use client'

import type { Task } from '@/lib/types'
import { MediaPlayer } from './media-player'

interface TaskItemProps {
  task: Task
  isCompleted: boolean
  isExpanded: boolean
  onToggle: (taskId: string) => void
  onTap: (taskId: string) => void
}

export function TaskItem({ task, isCompleted, isExpanded, onToggle, onTap }: TaskItemProps) {
  const borderClass = isExpanded
    ? 'border-2 border-black'
    : isCompleted
      ? 'border border-gray-200 bg-gray-50'
      : 'border border-gray-200'

  return (
    <div className={`p-3 ${borderClass}`}>
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => onTap(task.id)}
      >
        <button
          role="checkbox"
          aria-checked={isCompleted}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(task.id)
          }}
          className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 ${
            isCompleted
              ? 'bg-black border-black text-white'
              : 'border-black'
          }`}
        >
          {isCompleted && <span className="text-[10px] leading-none">✓</span>}
        </button>
        <span
          className={`text-xs font-semibold ${
            isCompleted ? 'line-through text-gray-400' : 'text-black'
          }`}
        >
          {task.title}
        </span>
      </div>
      {isExpanded && (
        <div className="ml-6 mt-2">
          {task.description && (
            <p className="text-[10px] text-gray-600 mb-2">{task.description}</p>
          )}
          <MediaPlayer items={task.media} />
        </div>
      )}
    </div>
  )
}
