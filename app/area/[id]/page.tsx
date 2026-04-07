'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AreaFile, Task } from '@/lib/types'
import { ProgressBar } from '@/components/progress-bar'
import { TaskItem } from '@/components/task-item'
import { useEditMode } from '@/components/edit-mode-provider'
import { EditableText } from '@/components/editable-text'
import { MediaUpload } from '@/components/media-upload'

export default function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [area, setArea] = useState<AreaFile | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const { isEditing, authorName } = useEditMode()

  useEffect(() => {
    const stored = localStorage.getItem(`progress-${id}`)
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setCompletedIds(new Set(parsed as string[]))
        }
      } catch {
        // ignore malformed storage
      }
    }
  }, [id])

  const fetchArea = useCallback(() => {
    fetch(`/api/areas/${id}`)
      .then((res) => res.json())
      .then((data: AreaFile) => setArea(data))
      .catch(() => {
        // silently ignore fetch errors for now
      })
  }, [id])

  useEffect(() => {
    fetchArea()
  }, [fetchArea])

  function handleToggle(taskId: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      localStorage.setItem(`progress-${id}`, JSON.stringify(Array.from(next)))
      return next
    })
  }

  async function saveTask(taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'media'>>) {
    await fetch(`/api/areas/${id}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, author: authorName }),
    })
    fetchArea()
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/areas/${id}/tasks/${taskId}`, { method: 'DELETE' })
    fetchArea()
  }

  async function addTask() {
    await fetch(`/api/areas/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Neue Aufgabe', description: '', author: authorName }),
    })
    fetchArea()
  }

  if (!area) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <p className="text-xs text-gray-400">Lädt…</p>
      </div>
    )
  }

  const allCompleted = area.tasks.length > 0 && area.tasks.every((t) => completedIds.has(t.id))

  // Auto-expand first incomplete task initially
  const firstIncompleteId = area.tasks.find((t) => !completedIds.has(t.id))?.id ?? null
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const activeExpandedId = expandedId ?? firstIncompleteId

  function handleTap(taskId: string) {
    setExpandedId((prev) => (prev === taskId ? null : taskId))
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <Link href="/" className="text-xs text-gray-500 hover:text-black">
        ← zurück
      </Link>

      <h1 className="font-bold text-sm mt-3 mb-3">
        {area.emoji} {area.name}
      </h1>

      {!isEditing && (
        <div className="mb-4">
          <ProgressBar total={area.tasks.length} completed={completedIds.size} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {area.tasks.map((task) => {
          if (isEditing) {
            return (
              <div key={task.id} className="border border-dashed border-gray-400 p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <EditableText
                      value={task.title}
                      onSave={(newTitle) => saveTask(task.id, { title: newTitle })}
                      as="span"
                      className="text-xs font-semibold"
                    />
                    <EditableText
                      value={task.description}
                      onSave={(newDesc) => saveTask(task.id, { description: newDesc })}
                      as="p"
                      className="text-[10px] text-gray-600"
                      multiline
                    />
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    aria-label="Aufgabe löschen"
                    className="text-gray-400 hover:text-red-600 text-xs shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {task.media.length > 0 && (
                  <div className="text-[10px] text-gray-500">
                    {task.media.length} Medium/Medien
                  </div>
                )}

                <MediaUpload
                  onUploaded={(url, type, filename) => {
                    const newMedia = [
                      ...task.media,
                      { type, url, label: filename },
                    ]
                    saveTask(task.id, { media: newMedia })
                  }}
                />
              </div>
            )
          }

          return (
            <TaskItem
              key={task.id}
              task={task}
              isCompleted={completedIds.has(task.id)}
              isExpanded={activeExpandedId === task.id}
              onToggle={handleToggle}
              onTap={handleTap}
            />
          )
        })}
      </div>

      {isEditing && (
        <button
          onClick={addTask}
          className="mt-4 w-full text-xs border border-dashed border-gray-400 px-4 py-2 text-gray-500 hover:border-black hover:text-black transition-colors"
        >
          + Aufgabe hinzufügen
        </button>
      )}

      {!isEditing && allCompleted && (
        <div className="mt-6">
          <Link
            href="/signoff"
            className="block text-center text-sm font-semibold border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
          >
            Alle erledigt — Abreise bestätigen
          </Link>
        </div>
      )}
    </div>
  )
}
