'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditMode } from './edit-mode-provider'

interface EditableTextProps {
  value: string
  onSave: (newValue: string) => void
  as?: 'span' | 'p' | 'div'
  className?: string
  multiline?: boolean
}

export function EditableText({
  value,
  onSave,
  as: Tag = 'span',
  className,
  multiline = false,
}: EditableTextProps) {
  const { isEditing } = useEditMode()
  const [localValue, setLocalValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [localValue, isEditing, autoResize])

  if (!isEditing) {
    return <Tag className={className}>{value}</Tag>
  }

  function handleBlur() {
    if (localValue !== value) {
      onSave(localValue)
    }
  }

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value)
        }}
        onBlur={handleBlur}
        className="w-full bg-white border border-gray-300 focus:outline-none focus:border-black px-3 py-3 text-base leading-relaxed resize-none overflow-hidden"
        rows={1}
        placeholder="Beschreibung..."
      />
    )
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className="w-full bg-white border border-gray-300 focus:outline-none focus:border-black px-3 py-3 text-base font-semibold"
      placeholder="Titel..."
    />
  )
}
