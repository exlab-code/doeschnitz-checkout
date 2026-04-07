import type { MediaItem } from '@/lib/types'

interface MediaPlayerProps {
  items: MediaItem[]
}

export function MediaPlayer({ items }: MediaPlayerProps) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 bg-gray-50 p-2">
          {item.type === 'video' ? (
            <video src={item.url} controls className="w-full" />
          ) : (
            <img src={item.url} alt={item.label} className="w-full" />
          )}
          <p className="text-xs text-gray-500 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
