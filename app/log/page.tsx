import Link from 'next/link'
import { getCheckouts } from '@/lib/content'
import type { CheckoutEntry } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LogPage() {
  const checkouts: CheckoutEntry[] = await getCheckouts()
  const reversed = [...checkouts].reverse()

  return (
    <div>
      <div className="mb-4">
        <Link href="/" className="text-xs text-gray-500">
          ← zurück
        </Link>
      </div>

      <h1 className="text-sm font-bold tracking-[3px] uppercase">
        LETZTE ABREISEN
      </h1>

      <div className="mt-4 flex flex-col gap-2">
        {reversed.length === 0 ? (
          <p className="text-xs text-gray-400">
            Noch keine Abreisen erfasst.
          </p>
        ) : (
          reversed.map((entry, index) => (
            <div key={index} className="border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{entry.name}</span>
                <span className="text-xs text-gray-500">
                  {entry.tasksCompleted}/{entry.tasksTotal}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(entry.date).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
