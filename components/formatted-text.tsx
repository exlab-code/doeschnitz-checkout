'use client'

interface FormattedTextProps {
  text: string
  className?: string
}

export function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null

  function flushList() {
    if (!currentList) return
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 my-2">
          {currentList.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    } else {
      elements.push(
        <ol key={elements.length} className="list-decimal list-inside space-y-1 my-2">
          {currentList.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      )
    }
    currentList = null
  }

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*•]\s+(.+)/)
    const numberMatch = line.match(/^\d+[.)]\s+(.+)/)

    if (bulletMatch) {
      if (currentList?.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(bulletMatch[1])
    } else if (numberMatch) {
      if (currentList?.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(numberMatch[1])
    } else {
      flushList()
      if (line.trim()) {
        elements.push(<p key={elements.length} className="my-1">{line}</p>)
      }
    }
  }
  flushList()

  return <div className={className}>{elements}</div>
}
