'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { AreaFile, AreaIndexItem } from '@/lib/types'

type PageState = 'initial' | 'submitted'

export default function SignoffPage() {
  const [state, setState] = useState<PageState>('initial')
  const [name, setName] = useState('')
  const [submittedName, setSubmittedName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('checkout-name')
    if (stored) setName(stored)
  }, [])

  async function handleSubmit() {
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      localStorage.setItem('checkout-name', name.trim())

      const areasRes = await fetch('/api/areas')
      const indexItems: AreaIndexItem[] = await areasRes.json()

      let tasksCompleted = 0
      let tasksTotal = 0

      await Promise.all(
        indexItems.map(async (item) => {
          try {
            const areaRes = await fetch(`/api/areas/${item.id}`)
            if (!areaRes.ok) return
            const area: AreaFile = await areaRes.json()
            tasksTotal += area.tasks.length
            const stored = localStorage.getItem(`progress-${item.id}`)
            tasksCompleted += stored ? parseInt(stored, 10) : 0
          } catch {
            // skip area on error
          }
        })
      )

      await fetch('/api/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), tasksCompleted, tasksTotal }),
      })

      for (const item of indexItems) {
        localStorage.removeItem(`progress-${item.id}`)
      }

      setSubmittedName(name.trim())
      setState('submitted')
    } catch {
      // keep form active on error
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state === 'submitted') {
    return (
      <div>
        <div className="mt-4">
          <p className="text-sm font-semibold">Danke, {submittedName}!</p>
          <p className="text-[10px] text-gray-400 mt-1">Abreise wurde erfasst.</p>
        </div>
        <div className="mt-6">
          <Link
            href="/"
            className="border border-gray-300 px-4 py-2 text-[10px]"
          >
            Zurück zum Start
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/" className="text-[10px] text-gray-500">
          ← zurück
        </Link>
      </div>

      <h1 className="text-xs font-bold tracking-[3px] uppercase">
        ABREISE BESTÄTIGEN
      </h1>
      <p className="text-[10px] text-gray-400 mt-1">
        Bitte mit deinem Namen unterschreiben.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <label
          htmlFor="name"
          className="text-[10px] text-gray-500 uppercase tracking-wider"
        >
          Dein Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-2 border-black px-3 py-2 text-sm font-mono focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="w-full border-2 border-black px-4 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-black hover:text-white disabled:opacity-30"
        >
          Abreise bestätigen
        </button>
      </div>
    </div>
  )
}
