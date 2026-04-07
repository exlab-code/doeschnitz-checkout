import Link from 'next/link'
import { ProgressBar } from './progress-bar'

interface AreaCardProps {
  id: string
  name: string
  emoji: string
  taskCount: number
  completedCount: number
}

export function AreaCard({ id, name, emoji, taskCount, completedCount }: AreaCardProps) {
  const progressFraction = completedCount > 0 ? `${completedCount}/${taskCount}` : '—'

  return (
    <Link href={`/area/${id}`} className="block border border-gray-200 p-3 hover:border-gray-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="font-semibold text-base">{name}</span>
        </div>
        <span className="text-sm text-gray-500">{progressFraction}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{taskCount} Aufgaben</p>
      {taskCount > 0 && (
        <div className="mt-2">
          <ProgressBar total={taskCount} completed={completedCount} />
        </div>
      )}
    </Link>
  )
}
