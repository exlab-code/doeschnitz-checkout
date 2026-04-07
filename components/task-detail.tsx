'use client'

import type { Task } from '@/lib/types'
import { useEditMode } from './edit-mode-provider'
import { EditableText } from './editable-text'
import { MediaUpload } from './media-upload'
import { FormattedText } from './formatted-text'

interface TaskDetailProps {
  task: Task
  isCompleted: boolean
  currentIndex: number
  totalTasks: number
  onToggle: (taskId: string) => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSaveTask: (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'media'>>) => void
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
  onSaveTask,
}: TaskDetailProps) {
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < totalTasks - 1
  const { isEditing } = useEditMode()

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm font-semibold px-3 py-2 border border-gray-300 hover:border-black hover:text-black text-gray-500 min-h-[44px]"
          >
            ← zur Liste
          </button>
          <span className="text-xs text-gray-400">
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
              className={`w-7 h-7 border-2 flex items-center justify-center shrink-0 mt-0.5 min-w-[44px] min-h-[44px] ${
                isCompleted
                  ? 'bg-black border-black text-white'
                  : 'border-black'
              }`}
            >
              {isCompleted && <span className="text-sm leading-none">✓</span>}
            </button>
            {isEditing ? (
              <EditableText
                value={task.title}
                onSave={(v) => onSaveTask(task.id, { title: v })}
                className="text-base font-bold text-black"
              />
            ) : (
              <h2
                className={`text-base font-bold ${
                  isCompleted ? 'line-through text-gray-400' : 'text-black'
                }`}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Description */}
          {isEditing ? (
            <div className="mb-6">
              <EditableText
                value={task.description}
                onSave={(v) => onSaveTask(task.id, { description: v })}
                as="p"
                className="text-sm text-gray-600"
                multiline
              />
            </div>
          ) : (
            task.description && (
              <FormattedText
                text={task.description}
                className="text-sm text-gray-600 leading-relaxed mb-6"
              />
            )
          )}

          {/* Media — large, portrait-optimized */}
          {task.media.length > 0 && (
            <div className="flex flex-col gap-4">
              {task.media.map((item, i) => (
                <div key={i} className="relative">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="w-full max-h-[70vh] object-contain"
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full max-h-[70vh] object-contain"
                    />
                  )}
                  {isEditing && (
                    <button
                      onClick={() => {
                        const updatedMedia = task.media.filter((_, idx) => idx !== i)
                        onSaveTask(task.id, { media: updatedMedia })
                      }}
                      className="absolute top-2 right-2 bg-white border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-400 w-8 h-8 flex items-center justify-center text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Media upload in edit mode */}
          {isEditing && (
            <MediaUpload
              onUploaded={(url, type, filename) => {
                const updatedMedia = [...task.media, { type, url, label: filename }]
                onSaveTask(task.id, { media: updatedMedia })
              }}
            />
          )}
        </div>
      </div>

      {/* Sticky bottom nav */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`text-sm font-semibold px-4 py-2.5 border-2 min-h-[44px] ${
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
            className={`text-sm font-semibold px-4 py-2.5 border-2 min-h-[44px] ${
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
