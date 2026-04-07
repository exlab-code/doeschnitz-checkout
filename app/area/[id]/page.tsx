'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AreaFile } from '@/lib/types'
import { ProgressBar } from '@/components/progress-bar'
import { TaskItem } from '@/components/task-item'

export default function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [area, setArea] = useState<AreaFile | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    fetch(`/api/areas/${id}`)
      .then((res) => res.json())
      .then((data: AreaFile) => setArea(data))
      .catch(() => {
        // silently ignore fetch errors for now
      })
  }, [id])

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

  if (!area) {
    return (
      <main className="max-w-sm mx-auto p-4">
        <p className="text-xs text-gray-400">Lädt…</p>
      </main>
    )
  }

  const allCompleted = area.tasks.length > 0 && area.tasks.every((t) => completedIds.has(t.id))

  return (
    <main className="max-w-sm mx-auto p-4">
      <Link href="/" className="text-xs text-gray-500 hover:text-black">
        ← zurück
      </Link>

      <h1 className="font-bold text-sm mt-3 mb-3">
        {area.emoji} {area.name}
      </h1>

      <div className="mb-4">
        <ProgressBar total={area.tasks.length} completed={completedIds.size} />
      </div>

      <div className="flex flex-col gap-2">
        {area.tasks.map((task) => {
          let status: 'completed' | 'current' | 'upcoming'
          if (completedIds.has(task.id)) {
            status = 'completed'
          } else {
            const firstIncomplete = area.tasks.find((t) => !completedIds.has(t.id))
            status = firstIncomplete?.id === task.id ? 'current' : 'upcoming'
          }

          return (
            <TaskItem
              key={task.id}
              task={task}
              status={status}
              onToggle={handleToggle}
            />
          )
        })}
      </div>

      {allCompleted && (
        <div className="mt-6">
          <Link
            href="/signoff"
            className="block text-center text-sm font-semibold border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
          >
            Alle erledigt — Abreise bestätigen
          </Link>
        </div>
      )}
    </main>
  )
}
