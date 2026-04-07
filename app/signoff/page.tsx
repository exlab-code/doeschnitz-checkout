'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { AreaFile, AreaIndexItem, Task } from '@/lib/types'
import { ProgressBar } from '@/components/progress-bar'
import { clearPosition } from '@/lib/last-position'

interface CheckoutTask {
  areaId: string
  areaName: string
  areaEmoji: string
  task: Task
}

type PageState = 'loading' | 'review' | 'submitted'

export default function SignoffPage() {
  const [state, setState] = useState<PageState>('loading')
  const [allTasks, setAllTasks] = useState<CheckoutTask[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [submittedName, setSubmittedName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [areas, setAreas] = useState<AreaIndexItem[]>([])

  const loadData = useCallback(async () => {
    const areasRes = await fetch('/api/areas')
    const indexItems: AreaIndexItem[] = await areasRes.json()
    setAreas(indexItems)

    const tasks: CheckoutTask[] = []
    const completed = new Set<string>()

    await Promise.all(
      indexItems.map(async (item) => {
        try {
          const areaRes = await fetch(`/api/areas/${item.id}`)
          if (!areaRes.ok) return
          const area: AreaFile = await areaRes.json()

          const stored = localStorage.getItem(`progress-${item.id}`)
          const doneIds: string[] = stored ? JSON.parse(stored) : []
          for (const id of doneIds) completed.add(`${item.id}:${id}`)

          for (const task of area.tasks) {
            tasks.push({
              areaId: item.id,
              areaName: item.name,
              areaEmoji: item.emoji,
              task,
            })
          }
        } catch { /* skip */ }
      })
    )

    setAllTasks(tasks)
    setCompletedIds(completed)
    setState('review')

    const storedName = localStorage.getItem('checkout-name')
    if (storedName) setName(storedName)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function toggleTask(areaId: string, taskId: string) {
    const key = `${areaId}:${taskId}`

    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      // Update localStorage for this area
      const areaTasks = allTasks.filter((t) => t.areaId === areaId)
      const areaCompleted = areaTasks
        .filter((t) => next.has(`${t.areaId}:${t.task.id}`))
        .map((t) => t.task.id)
      localStorage.setItem(`progress-${areaId}`, JSON.stringify(areaCompleted))

      return next
    })
  }

  async function handleSubmit() {
    if (!name.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      localStorage.setItem('checkout-name', name.trim())

      let tasksCompleted = 0
      for (const t of allTasks) {
        if (completedIds.has(`${t.areaId}:${t.task.id}`)) tasksCompleted++
      }

      await fetch('/api/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tasksCompleted,
          tasksTotal: allTasks.length,
        }),
      })

      for (const item of areas) {
        localStorage.removeItem(`progress-${item.id}`)
      }
      clearPosition()

      setSubmittedName(name.trim())
      setState('submitted')
    } catch { /* keep form active */ } finally {
      setIsSubmitting(false)
    }
  }

  if (state === 'loading') {
    return <p className="text-sm text-gray-400 mt-8">Laden...</p>
  }

  if (state === 'submitted') {
    return (
      <div className="mt-8 text-center">
        <p className="text-lg font-bold">Danke, {submittedName}!</p>
        <p className="text-sm text-gray-400 mt-2">Abreise wurde erfasst.</p>
        <Link
          href="/"
          className="inline-block mt-6 border border-gray-300 px-4 py-2 text-sm hover:border-black transition-colors"
        >
          Zurück zum Start
        </Link>
      </div>
    )
  }

  // Review state
  const totalCompleted = allTasks.filter(
    (t) => completedIds.has(`${t.areaId}:${t.task.id}`)
  ).length
  const openTasks = allTasks.filter(
    (t) => !completedIds.has(`${t.areaId}:${t.task.id}`)
  )

  // Group open tasks by area
  const openByArea = new Map<string, { emoji: string; name: string; tasks: CheckoutTask[] }>()
  for (const t of openTasks) {
    if (!openByArea.has(t.areaId)) {
      openByArea.set(t.areaId, { emoji: t.areaEmoji, name: t.areaName, tasks: [] })
    }
    openByArea.get(t.areaId)!.tasks.push(t)
  }

  return (
    <div className="pb-48">
      <Link href="/" className="text-sm text-gray-500 hover:text-black">
        ← zurück
      </Link>

      <h1 className="text-sm font-bold tracking-[3px] uppercase mt-4">
        Checkout
      </h1>

      <div className="mt-4">
        <ProgressBar total={allTasks.length} completed={totalCompleted} />
        <p className="text-xs text-gray-400 mt-2">
          {totalCompleted} / {allTasks.length} erledigt
        </p>
      </div>

      {openTasks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Noch offen
          </h2>
          <div className="flex flex-col gap-4">
            {Array.from(openByArea.entries()).map(([areaId, group]) => (
              <div key={areaId}>
                <p className="text-xs text-gray-400 mb-1">
                  {group.emoji} {group.name}
                </p>
                <div className="flex flex-col gap-1">
                  {group.tasks.map((t) => (
                    <div
                      key={t.task.id}
                      className="flex items-center gap-2 border border-gray-200 p-3"
                    >
                      <button
                        role="checkbox"
                        aria-checked={false}
                        onClick={() => toggleTask(t.areaId, t.task.id)}
                        className="w-6 h-6 border-2 border-black flex items-center justify-center shrink-0"
                      />
                      <span className="text-sm">{t.task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {openTasks.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          Alles erledigt ✓
        </p>
      )}

      {/* Sign-off form — sticky at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-30">
        <div className="max-w-md mx-auto">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              className="flex-1 border-2 border-black px-3 py-2.5 text-sm font-mono focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="border-2 border-black px-4 py-2.5 text-sm font-semibold hover:bg-black hover:text-white disabled:opacity-30 transition-colors shrink-0"
            >
              {isSubmitting ? '...' : 'Bestätigen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
