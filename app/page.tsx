'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AreaCard } from '@/components/area-card'
import type { AreaFile, AreaIndexItem } from '@/lib/types'

interface AreaCardData {
  id: string
  name: string
  emoji: string
  taskCount: number
  completedCount: number
}

export default function Home() {
  const [areas, setAreas] = useState<AreaCardData[]>([])

  useEffect(() => {
    async function loadAreas() {
      try {
        const res = await fetch('/api/areas')
        if (!res.ok) return
        const indexItems: AreaIndexItem[] = await res.json()

        const cardData = await Promise.all(
          indexItems.map(async (item) => {
            try {
              const areaRes = await fetch(`/api/areas/${item.id}`)
              if (!areaRes.ok) {
                return { id: item.id, name: item.name, emoji: item.emoji, taskCount: 0, completedCount: 0 }
              }
              const area: AreaFile = await areaRes.json()
              const taskCount = area.tasks.length
              const stored = localStorage.getItem(`progress-${item.id}`)
              const completedCount = stored ? JSON.parse(stored).length : 0
              return { id: item.id, name: item.name, emoji: item.emoji, taskCount, completedCount }
            } catch {
              return { id: item.id, name: item.name, emoji: item.emoji, taskCount: 0, completedCount: 0 }
            }
          })
        )

        setAreas(cardData)
      } catch {
        // silently ignore network errors on mount
      }
    }

    loadAreas()
  }, [])

  return (
    <div>
      <h1 className="text-xs font-bold tracking-[3px] uppercase">ABREISE</h1>
      <p className="text-[10px] text-gray-400 tracking-wider uppercase mt-1">HAUS DÖSCHNITZ</p>

      <div className="flex flex-col gap-2 mt-4">
        {areas.map((area) => (
          <AreaCard
            key={area.id}
            id={area.id}
            name={area.name}
            emoji={area.emoji}
            taskCount={area.taskCount}
            completedCount={area.completedCount}
          />
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/log"
          className="text-[10px] text-gray-400 uppercase tracking-wider"
        >
          Letzte Abreisen
        </Link>
      </div>
    </div>
  )
}
