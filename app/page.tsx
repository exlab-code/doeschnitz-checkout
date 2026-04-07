'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AreaCard } from '@/components/area-card'
import type { AreaFile, AreaIndexItem } from '@/lib/types'
import { getPosition } from '@/lib/last-position'

interface AreaCardData {
  id: string
  name: string
  emoji: string
  taskCount: number
  completedCount: number
}

interface ResumeBanner {
  areaId: string
  areaEmoji: string
  areaName: string
}

export default function Home() {
  const [areas, setAreas] = useState<AreaCardData[]>([])
  const [resumeBanner, setResumeBanner] = useState<ResumeBanner | null>(null)

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

        const pos = getPosition()
        if (pos) {
          const match = cardData.find((a) => a.id === pos.areaId)
          if (match && match.completedCount < match.taskCount) {
            setResumeBanner({ areaId: match.id, areaEmoji: match.emoji, areaName: match.name })
          }
        }
      } catch {
        // silently ignore network errors on mount
      }
    }

    loadAreas()
  }, [])

  return (
    <>
      <div className="pb-20">
        <h1 className="text-sm font-bold tracking-[3px] uppercase">ABREISE</h1>
        <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">HAUS DÖSCHNITZ</p>

        {resumeBanner && (
          <Link
            href={`/area/${resumeBanner.areaId}`}
            className="flex items-center gap-2 mt-4 px-3 py-2.5 border-2 border-black bg-black text-white text-sm font-semibold hover:bg-white hover:text-black transition-colors"
          >
            <span>Weiter: {resumeBanner.areaEmoji} {resumeBanner.areaName}</span>
            <span className="ml-auto">→</span>
          </Link>
        )}

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

        <div className="mt-4 text-center">
          <Link
            href="/log"
            className="inline-flex items-center justify-center text-xs text-gray-400 uppercase tracking-wider min-h-[44px] px-3"
          >
            Letzte Abreisen
          </Link>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30">
        <div className="max-w-md mx-auto">
          <Link
            href="/signoff"
            className="flex items-center justify-center text-center text-sm font-semibold px-4 py-2.5 border-2 border-black hover:bg-black hover:text-white transition-colors min-h-[44px]"
          >
            Checkout
          </Link>
        </div>
      </div>
    </>
  )
}
