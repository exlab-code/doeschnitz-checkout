interface ProgressBarProps {
  total: number
  completed: number
}

export function ProgressBar({ total, completed }: ProgressBarProps) {
  if (total === 0) return null

  return (
    <div className="flex flex-row gap-1 h-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          data-segment
          data-filled={i < completed}
          className={`flex-1 h-1 ${i < completed ? 'bg-black' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}
