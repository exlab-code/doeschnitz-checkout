'use client'

import { useState } from 'react'
import { useEditMode } from './edit-mode-provider'

interface MediaUploadProps {
  onUploaded: (url: string, type: 'image' | 'video', filename: string) => void
}

export function MediaUpload({ onUploaded }: MediaUploadProps) {
  const { isEditing } = useEditMode()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isEditing) return null

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Upload fehlgeschlagen (${res.status})`)
      }
      const data = await res.json() as { url: string; filename: string }
      const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'
      onUploaded(data.url, type, data.filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <label className={`flex items-center justify-center border border-dashed border-gray-400 px-3 py-3 text-sm cursor-pointer transition-colors ${
        uploading ? 'text-gray-300' : 'text-gray-500 hover:border-black hover:text-black'
      }`}>
        {uploading ? 'Wird hochgeladen...' : '+ Foto / Video hinzufügen'}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
