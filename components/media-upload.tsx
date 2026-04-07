'use client'

import { useEditMode } from './edit-mode-provider'

interface MediaUploadProps {
  onUploaded: (url: string, type: 'image' | 'video', filename: string) => void
}

export function MediaUpload({ onUploaded }: MediaUploadProps) {
  const { isEditing } = useEditMode()

  if (!isEditing) return null

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json() as { url: string; filename: string }
      const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'
      onUploaded(data.url, type, data.filename)
    } catch (err) {
      throw new Error(`Media upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <label className="flex items-center justify-center border border-dashed border-gray-400 px-3 py-2 text-xs text-gray-500 cursor-pointer hover:border-black hover:text-black transition-colors">
      + Foto / Video hinzufügen
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleChange}
        className="hidden"
      />
    </label>
  )
}
