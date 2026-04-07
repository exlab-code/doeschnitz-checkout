'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  if (!isEditing) {
    return <Tag className={className}>{value}</Tag>
  }

  function handleBlur() {
    if (localValue !== value) {
      onSave(localValue)
    }
  }

  const inputClass = `w-full bg-white border border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm ${className ?? ''}`

  if (multiline) {
    return (
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`${inputClass} resize-none`}
        rows={3}
      />
    )
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className={inputClass}
    />
  )
}
