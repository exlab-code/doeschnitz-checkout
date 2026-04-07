'use client'

import type { Task } from '@/lib/types'

interface TaskDetailProps {
  task: Task
  isCompleted: boolean
  currentIndex: number
  totalTasks: number
  onToggle: (taskId: string) => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function TaskDetail({
  task,
  isCompleted,
  currentIndex,
  totalTasks,
  onToggle,
  onClose,
  onPrev,
  onNext,
}: TaskDetailProps) {
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < totalTasks - 1

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 border border-gray-300 hover:border-black hover:text-black text-gray-500"
          >
            ← zur Liste
          </button>
          <span className="text-[10px] text-gray-400">
            {currentIndex + 1} / {totalTasks}
          </span>
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-4">
          {/* Title + checkbox */}
          <div className="flex items-start gap-3 mb-4">
            <button
              role="checkbox"
              aria-checked={isCompleted}
              onClick={() => onToggle(task.id)}
              className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                isCompleted
                  ? 'bg-black border-black text-white'
                  : 'border-black'
              }`}
            >
              {isCompleted && <span className="text-xs leading-none">✓</span>}
            </button>
            <h2
              className={`text-sm font-bold ${
                isCompleted ? 'line-through text-gray-400' : 'text-black'
              }`}
            >
              {task.title}
            </h2>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              {task.description}
            </p>
          )}

          {/* Media — large, portrait-optimized */}
          {task.media.length > 0 && (
            <div className="flex flex-col gap-4">
              {task.media.map((item, i) => (
                <div key={i}>
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="w-full max-h-[70vh] object-contain bg-gray-50"
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full max-h-[70vh] object-contain bg-gray-50"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom nav */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`text-xs font-semibold px-4 py-2 border-2 ${
              hasPrev
                ? 'border-black hover:bg-black hover:text-white'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
          >
            ← Zurück
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`text-xs font-semibold px-4 py-2 border-2 ${
              hasNext
                ? 'border-black hover:bg-black hover:text-white'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  )
}
